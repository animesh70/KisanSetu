import { Bot, ImagePlus, MessageCircle, Mic, MicOff, Send, Volume2, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { getSpeechLocale, LANGUAGE_OPTIONS } from '../i18n';
import { speakText, stopSpeech } from '../services/tts';
import { getKittyCommand } from '../services/kittyCommands';
import { createSpeechRecognitionSession, speechRecognitionErrorKey, startRecognitionAfterStoppingPlayback } from '../services/speechRecognitionSession';
import { cropImageAssistantMessage } from '../services/cropImageResult';

const hasNumber = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
const formatPrice = (value) => hasNumber(value) ? `₹${Number(value).toLocaleString('en-IN')}` : null;
const formatPerQuintal = (value) => {
  const price = formatPrice(value);
  return price ? `${price}/q` : null;
};
const readableStatus = (value) => String(value || '').replaceAll('_', ' ');

// Intents deliberately use transparent, weighted rules instead of pretending to be a live LLM.
// Longer phrases have more weight than individual words, and declaration order resolves a tie.
const INTENT_RULES = [
  {
    id: 'recommendation',
    phrases: [['should i sell', 16], ['sell now', 15], ['hold for', 14], ['selling recommendation', 14], ['best time to sell', 14], ['when should i sell', 14], ['should i wait', 13]],
    keywords: [['sell', 7], ['hold', 7], ['wait', 6], ['recommend', 6], ['forecast', 4], ['prediction', 4], ['trend', 3]]
  },
  {
    id: 'market',
    phrases: [['best market', 15], ['best mandi', 15], ['market price', 14], ['mandi price', 14], ['nearby market', 12], ['nearby mandi', 12]],
    keywords: [['market', 6], ['mandi', 6], ['price', 4], ['rate', 4]]
  },
  {
    id: 'buyer',
    phrases: [['buyer offer', 15], ['buyer match', 15], ['best buyer', 14], ['show offers', 13], ['who should i sell', 13], ['buyer matching', 12]],
    keywords: [['buyer', 6], ['offer', 6], ['match', 5], ['negotiate', 5], ['counter', 4]]
  },
  {
    id: 'marketplace',
    phrases: [['direct marketplace', 20], ['escrow payment', 19], ['escrow funds', 18], ['delivery otp', 18], ['proof of delivery', 17], ['buy directly', 16], ['platform fee', 15], ['split payout', 15]],
    keywords: [['marketplace', 9], ['escrow', 9], ['otp', 8], ['commission', 6], ['payout', 5]]
  },
  {
    id: 'equipment',
    phrases: [['equipment sharing', 18], ['rent equipment', 17], ['rent tractor', 17], ['farm machinery', 16], ['rental activity', 16], ['rental request', 15], ['list equipment', 15], ['approve rental', 15], ['reject rental', 15], ['agricultural machinery', 14]],
    keywords: [['equipment', 8], ['tractor', 8], ['machinery', 7], ['machine', 6], ['rotavator', 8], ['harvester', 8], ['sprayer', 7], ['seeder', 7], ['thresher', 7], ['cultivator', 7], ['rental', 5], ['rent', 4]]
  },
  {
    id: 'logistics',
    phrases: [['choose logistics', 14], ['select logistics', 14], ['transport cost', 13], ['cold storage', 13], ['schedule pickup', 12]],
    keywords: [['transport', 6], ['logistics', 6], ['pickup', 5], ['storage', 5], ['driver', 4], ['haul', 4]]
  },
  {
    id: 'payment',
    phrases: [['payment status', 15], ['track payment', 15], ['payment received', 14], ['transaction status', 14], ['delivery status', 12]],
    keywords: [['payment', 6], ['transaction', 6], ['delivery', 5], ['paid', 5], ['receipt', 4], ['payout', 4]]
  },
  {
    id: 'lot',
    phrases: [['create a lot', 15], ['create crop lot', 15], ['publish lot', 14], ['my crop lots', 13]],
    keywords: [['lot', 6], ['crop', 3], ['publish', 5], ['grade', 3], ['variety', 3]]
  },
  {
    id: 'earnings',
    phrases: [['how much will i get', 16], ['net realisation', 15], ['net realization', 15], ['net earnings', 15], ['net price', 13], ['farmer payout', 13]],
    keywords: [['earning', 6], ['earnings', 6], ['net', 4], ['receive', 4], ['amount', 3]]
  }
];

function normalise(question) {
  return String(question || '').toLowerCase().replace(/[^a-z0-9₹]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function scoreRule(text, rule) {
  const words = new Set(text.split(' ').filter(Boolean));
  return rule.phrases.reduce((score, [phrase, weight]) => score + (text.includes(phrase) ? weight : 0), 0)
    + rule.keywords.reduce((score, [keyword, weight]) => score + (words.has(keyword) ? weight : 0), 0);
}

function resolveIntent(question, previousIntent, context) {
  const text = normalise(question);
  const isWhyFollowUp = /^(why|why is that|why this|explain|explain that)$/.test(text);
  const isNextQuestion = /^(what should i do next|what do i do next|what should i do|what next|next|what now)$/.test(text);
  const isShortFollowUp = /^(and|and then|how about that|what about that|tell me more|more|how much)$/.test(text);
  const activeTransaction = (context?.transactions || []).find((transaction) => transaction?.status && transaction.status !== 'completed');

  if (isNextQuestion && activeTransaction) {
    return {
      id: activeTransaction.status === 'confirmed' && !activeTransaction.logisticsOptionId ? 'logistics' : 'payment',
      followUp: 'next'
    };
  }

  if ((isWhyFollowUp || isShortFollowUp || isNextQuestion) && previousIntent) {
    return { id: previousIntent, followUp: isWhyFollowUp ? 'why' : 'next' };
  }

  const ranked = INTENT_RULES.map((rule, index) => ({ id: rule.id, score: scoreRule(text, rule), index }))
    .sort((left, right) => right.score - left.score || left.index - right.index);
  const top = ranked[0];

  if (!top || top.score === 0) return { id: 'help', followUp: null };
  return { id: top.id, followUp: null };
}

function normaliseAnyLanguage(value) {
  return String(value || '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

function resolveLocalizedIntent(question, previousIntent, context, t) {
  const resolved = resolveIntent(question, previousIntent, context);
  if (resolved.id !== 'help') return resolved;
  const text = normaliseAnyLanguage(question);
  const candidates = [
    ['marketplace', [t('nav.marketplace'), t('marketplace.title'), t('marketplace.escrowActivity')]],
    ['equipment', [t('equipment.nav'), t('equipment.title'), t('equipment.listEquipment'), t('equipment.rent')]],
    ['market', [t('nav.markets'), t('page.bestMandiRate'), t('page.nearbyPrices'), t('page.viewAllPrices')]],
    ['buyer', [t('nav.buyers'), t('page.verifiedBuyerOffer'), t('page.buyersMatched'), t('page.reviewOffers')]],
    ['logistics', [t('nav.logistics'), t('page.logisticsOptions'), t('page.transport'), t('page.storage')]],
    ['payment', [t('nav.transactions'), t('page.transactions'), t('page.payment'), t('page.delivery')]],
    ['lot', [t('nav.lots'), t('page.createALot'), t('page.createCropLot'), t('page.lotsTitle')]],
    ['earnings', [t('page.bestNetPrice'), t('page.farmerPayout'), t('page.earningsCalculator')]],
    ['recommendation', [t('page.sellNow'), t('page.holdBriefly'), t('page.smartPrediction'), t('page.whyRecommendation')]]
  ];
  for (const [id, labels] of candidates) {
    if (labels.some((label) => {
      const token = normaliseAnyLanguage(label);
      return token.length > 2 && text.includes(token);
    })) return { id, followUp: null };
  }
  return resolved;
}

function numberFrom(...values) {
  return values.find(hasNumber);
}

function byNumericField(items, field) {
  return [...items].filter((item) => hasNumber(item?.[field])).sort((left, right) => Number(right[field]) - Number(left[field]))[0] || null;
}

function getFacts(context) {
  const data = context?.data || {};
  const recommendation = data.recommendation || {};
  const options = Array.isArray(recommendation.options) ? recommendation.options : [];
  const marketOptions = options.filter((option) => option?.type === 'mandi');
  const buyerOptions = options.filter((option) => option?.type === 'buyer');
  const bestMarketOption = byNumericField(marketOptions, 'netPrice');
  const highestDisplayedMarket = byNumericField(Array.isArray(data.prices) ? data.prices : [], 'modalPrice');
  const recommendedBuyer = recommendation.recommendedBuyer || null;
  const buyerOption = buyerOptions.find((option) => option?.name === recommendedBuyer?.name) || byNumericField(buyerOptions, 'netPrice');
  const pendingOffers = (context?.offers || []).filter((offer) => offer?.status === 'pending');
  const activeTransaction = (context?.transactions || []).find((transaction) => transaction?.status && transaction.status !== 'completed') || null;

  return {
    filters: context?.filters || {},
    recommendation,
    bestMarketOption,
    highestDisplayedMarket,
    recommendedBuyer,
    buyerOption,
    pendingOffers,
    activeTransaction,
    selectedService: context?.selectedService || null,
    logistics: Array.isArray(context?.logistics) ? context.logistics : [],
    lots: Array.isArray(context?.lots) ? context.lots : [],
    equipmentSnapshot: context?.equipmentSnapshot || null,
    equipmentDemoUserName: context?.equipmentDemoUserName || ''
  };
}

function localizedResponse(intent, context, t, question = '', followUp = null) {
  const facts = getFacts(context);
  const recommendation = facts.recommendation;
  const expectedNet = formatPerQuintal(recommendation.expectedNetPrice);
  const buyer = facts.recommendedBuyer;
  const market = facts.bestMarketOption || facts.highestDisplayedMarket;
  const transaction = facts.activeTransaction;
  const selected = facts.selectedService || (transaction?.logisticsProvider ? { provider: transaction.logisticsProvider } : null);
  const query = normalise(question);
  const actions = {
    recommendation: [t('page.whyRecommendation'), 'recommendation'], market: [t('page.viewAllPrices'), 'market'],
    buyer: [t('page.reviewOffers'), 'offers'], marketplace: [t('nav.marketplace', { defaultValue: 'Direct marketplace' }), 'marketplace'], logistics: [t('page.logisticsOptions'), 'logistics'],
    equipment: [t('equipment.openMarketplace'), 'equipment'],
    payment: [t('page.transactions'), 'transactions'], earnings: [t('page.whyRecommendation'), 'recommendation'],
    lot: [t('page.createALot'), 'create-lot'], help: [t('page.whyRecommendation'), 'recommendation']
  };
  const [action, key] = actions[intent] || actions.help;

  if (intent === 'recommendation') return {
    intent, title: t('page.smartPrediction'),
    message: `${recommendation.action === 'sell' ? t('page.sellNow') : t('page.holdBriefly')} · ${t('page.bestNetPrice')}: ${expectedNet || '—'}. ${t(recommendation.action === 'sell' ? 'page.sellReason' : 'page.holdReason')}`,
    action, key
  };
  if (intent === 'market') return {
    intent, title: t('page.bestMandiRate'),
    message: market ? `${market.name || market.mandiName} · ${t('page.modalPrice')}: ${formatPerQuintal(numberFrom(market.grossPrice, market.modalPrice)) || '—'} · ${t('page.netPerQuintal')}: ${formatPerQuintal(numberFrom(market.netPrice, market.netRealisation)) || '—'}.` : t('page.marketDataNote'),
    action, key
  };
  if (intent === 'buyer') return {
    intent, title: t('page.buyersMatched'),
    message: buyer ? `${buyer.name} · ${t('page.verifiedBuyerOffer')}: ${formatPerQuintal(buyer.offerPrice) || '—'} · ${t('page.matchScore')}: ${buyer.matchScore || '—'}%.` : t('page.noBuyer'),
    action, key
  };
  if (intent === 'marketplace') {
    const escrowTransactions = (context?.transactions || []).filter((item) => item?.escrowStatus);
    const locked = escrowTransactions.filter((item) => item.escrowStatus === 'funds_locked').length;
    const released = escrowTransactions.filter((item) => item.escrowStatus === 'released').length;
    const openLots = (context?.lots || []).filter((item) => item.status === 'open').length;
    return {
      intent,
      title: t('nav.marketplace', { defaultValue: 'Direct marketplace' }),
      message: t('marketplace.assistantOverview', { open: openLots, locked, released, fee: recommendation.platformFeePercent || 1.5 }),
      action, key
    };
  }
  if (intent === 'equipment') {
    const snapshot = facts.equipmentSnapshot || {};
    if (snapshot.unavailable) {
      return { intent, title: t('equipment.assistantTitle'), message: t('equipment.unavailable'), action, key };
    }
    const items = Array.isArray(snapshot.items) ? snapshot.items : [];
    const rentals = Array.isArray(snapshot.rentals) ? snapshot.rentals : [];
    const incomingRequested = rentals.filter((rental) => rental.role === 'owner' && rental.status === 'requested');
    const outgoing = rentals.filter((rental) => rental.role === 'renter');
    const approved = rentals.filter((rental) => rental.status === 'approved');
    const specificType = ['tractor', 'rotavator', 'harvester', 'seeder', 'sprayer', 'thresher', 'cultivator']
      .find((type) => query.includes(type));
    const matchingItems = specificType
      ? items.filter((item) => `${item.type || ''} ${item.name || ''}`.toLowerCase().includes(specificType))
      : items;
    const availableSummary = matchingItems.slice(0, 3).map((item) => `${item.name} (${formatPrice(item.dailyRate) || '—'}${t('equipment.perDay')})`).join(' · ');
    const wantsApproval = /approve|reject|owner|incoming|accept request/.test(query);
    const wantsListing = /list|publish|add|my equipment|offer equipment/.test(query);
    const wantsStatus = /status|activity|pending|approved|cancelled|completed|my request|request status/.test(query);
    const wantsRenting = /rent|hire|book|available|tractor|rotavator|harvester|seeder|sprayer|thresher|cultivator/.test(query);
    let message;
    if (wantsApproval) {
      message = `${t('equipment.assistantApprovalHelp')} ${t('equipment.assistantStatusSummary', { incoming: incomingRequested.length, outgoing: outgoing.length, approved: approved.length })}`;
    } else if (wantsListing) {
      message = t('equipment.assistantListHelp');
    } else if (wantsStatus) {
      message = `${t('equipment.assistantCurrentUser', { name: facts.equipmentDemoUserName || t('page.farmer') })} ${t('equipment.assistantStatusSummary', { incoming: incomingRequested.length, outgoing: outgoing.length, approved: approved.length })}`;
    } else if (wantsRenting) {
      message = `${t('equipment.assistantRentHelp')} ${availableSummary ? t('equipment.assistantAvailable', { items: availableSummary }) : t('equipment.assistantNoAvailable')}`;
    } else {
      message = `${t('equipment.assistantOverview')} ${availableSummary ? t('equipment.assistantAvailable', { items: availableSummary }) : ''}`.trim();
    }
    return { intent, title: t('equipment.assistantTitle'), message, action, key };
  }
  if (intent === 'logistics') return {
    intent, title: t('page.logisticsOptions'),
    message: selected ? t('page.selectedConfirmation', { provider: selected.provider }) : `${facts.logistics.map((item) => item.provider).join(' · ') || t('page.notSpecified')}. ${t('page.select')}.`,
    action, key
  };
  if (intent === 'payment') return {
    intent, title: t('page.transactions'),
    message: transaction ? `${t('page.payment')}: ${readableStatus(transaction.paymentStatus || transaction.status)} · ${t('page.farmerPayout')}: ${formatPrice(numberFrom(transaction.netPayable, transaction.amount)) || '—'}.` : t('page.noOffersDescription'),
    action, key
  };
  if (intent === 'earnings') return {
    intent, title: t('page.farmerPayout'), message: `${t('page.bestNetPrice')}: ${expectedNet || '—'}. ${t('page.earningsDescription')}`, action, key
  };
  if (intent === 'lot') return {
    intent, title: t('page.createCropLot'), message: `${t('page.lotsDescription')} ${t('page.quantityFit')} · ${t('page.qualityGrade')} · ${t('page.pickupLocation')}.`, action, key
  };
  return { intent: 'help', title: t('assistant.hello'), message: t('assistant.intro'), action, key };
}

function response(intent, context, followUp, question = '', t) {
  if (t) return localizedResponse(intent, context, t, question, followUp);
  const facts = getFacts(context);
  const query = normalise(question);
  const cropDescription = [facts.filters.crop, hasNumber(facts.filters.quantity) ? `${facts.filters.quantity} q` : null].filter(Boolean).join(' · ');
  const recommendation = facts.recommendation;
  const expectedNet = formatPerQuintal(recommendation.expectedNetPrice);

  if (intent === 'recommendation') {
    const reasonText = Array.isArray(recommendation.reasons) ? recommendation.reasons.filter(Boolean) : [];
    if (followUp === 'why') {
      return {
        intent,
        title: 'Why the current recommendation was made',
        message: reasonText.length ? reasonText.join(' ') : 'The current dashboard response does not include explanation details. Refresh the market check to request an updated recommendation.',
        action: 'View recommendation',
        key: 'recommendation'
      };
    }
    const decision = recommendation.decisionText || recommendation.sellingWindow || null;
    const message = [cropDescription ? `For ${cropDescription},` : null, decision ? `the current backend recommendation is: ${decision}.` : 'A selling recommendation is not available yet.', expectedNet ? `Expected best net: ${expectedNet}.` : null, reasonText[0] || null].filter(Boolean).join(' ');
    return { intent, title: 'Current sell / hold recommendation', message, action: 'View recommendation', key: 'recommendation' };
  }

  if (intent === 'market') {
    const option = facts.bestMarketOption;
    if (option) {
      const gross = formatPerQuintal(numberFrom(option.grossPrice, option.modalPrice));
      const transport = formatPerQuintal(numberFrom(option.estimatedLogisticsCost, option.transportCost));
      const net = formatPerQuintal(option.netPrice);
      return {
        intent,
        title: 'Best mandi by estimated net',
        message: [`${option.name} is the highest ranked mandi option in the current dashboard result.`, gross ? `Modal price: ${gross}.` : null, transport ? `Estimated transport: ${transport}.` : null, net ? `Estimated net: ${net}.` : null].filter(Boolean).join(' '),
        action: 'View market prices',
        key: 'market'
      };
    }
    const market = facts.highestDisplayedMarket;
    return {
      intent,
      title: market ? 'Highest displayed mandi rate' : 'Market information',
      message: market ? `${market.mandiName} shows a modal price of ${formatPerQuintal(market.modalPrice)} in the current dashboard data. An estimated net value is not available for this market yet.` : 'Market information is loading. Run “Check prices” and try again.',
      action: 'View market prices',
      key: 'market'
    };
  }

  if (intent === 'buyer') {
    const buyer = facts.recommendedBuyer;
    const buyerNet = formatPerQuintal(numberFrom(facts.buyerOption?.estimatedNetPrice, facts.buyerOption?.netPrice));
    const offerPrice = formatPerQuintal(buyer?.offerPrice);
    const matchScore = hasNumber(buyer?.matchScore) ? `${Number(buyer.matchScore)}% match score` : null;
    const pending = facts.pendingOffers.length ? `${facts.pendingOffers.length} pending offer${facts.pendingOffers.length === 1 ? '' : 's'} in Transactions.` : null;
    const wantsMatchExplanation = followUp === 'why' || /match score|how.*match|why.*rank|ranking/.test(query);
    if (wantsMatchExplanation) {
      const breakdown = facts.buyerOption?.scoreBreakdown || {};
      const scoreDetails = [
        ['Offer price', breakdown.offerPrice, 15],
        ['Distance', breakdown.distance, 15],
        ['Quantity fit', breakdown.quantityFit, 30],
        ['Grade', breakdown.grade, 20],
        ['Reliability', breakdown.reliability, 20]
      ].filter(([, score]) => hasNumber(score)).map(([label, score, total]) => `${label}: ${score}/${total}`).join('; ');
      return {
        intent,
        title: buyer ? `Why ${buyer.name} is matched` : 'Buyer match explanation',
        message: scoreDetails ? `The current backend score breakdown is ${scoreDetails}.` : 'The current dashboard result does not include a buyer score breakdown.',
        action: 'View buyer offers',
        key: 'offers'
      };
    }
    const asksCoverage = /\b(all|entire|whole|full|remaining|coverage)\b|how much can/.test(query);
    const tradableQuantity = numberFrom(buyer?.tradableQuantity, facts.buyerOption?.tradableQuantity);
    const remainingQuantity = numberFrom(buyer?.remainingQuantity, facts.buyerOption?.remainingQuantity);
    const coverage = asksCoverage && hasNumber(tradableQuantity)
      ? Number(remainingQuantity || 0) > 0
        ? `${buyer?.name || 'This buyer'} can cover ${tradableQuantity} q, leaving ${remainingQuantity} q unmatched in this buyer offer.`
        : `${buyer?.name || 'This buyer'} can cover the full current lot of ${tradableQuantity} q.`
      : null;
    return {
      intent,
      title: buyer ? 'Current recommended buyer' : 'Buyer matching',
      message: buyer ? [`${buyer.name} is the current backend recommendation.`, offerPrice ? `Offer: ${offerPrice}.` : null, buyerNet ? `Estimated net: ${buyerNet}.` : null, matchScore ? `${matchScore}.` : null, coverage, pending].filter(Boolean).join(' ') : (pending || 'No eligible buyer match is available for the current crop and quality.'),
      action: 'View buyer offers',
      key: 'offers'
    };
  }

  if (intent === 'logistics') {
    const transaction = facts.activeTransaction;
    const transactionSelection = transaction?.logisticsOptionId
      ? facts.logistics.find((service) => service.id === transaction.logisticsOptionId)
      : null;
    const selected = facts.selectedService || transactionSelection || (transaction?.logisticsProvider ? { provider: transaction.logisticsProvider, type: transaction.logisticsType } : null);
    const names = facts.logistics.map((service) => `${service.provider}${service.type ? ` (${service.type})` : ''}`).filter(Boolean);
    const wantsCalculation = /how.*(transport|logistics|cost)|transport.*(calculate|formula)|logistics.*(calculate|formula)/.test(query);
    const calculationDetail = wantsCalculation
      ? ` The backend quote uses the selected provider’s distance, vehicle capacity, and tradable quantity to determine trips and the total cost.${hasNumber(transaction?.transportTrips) ? ` This transaction uses ${transaction.transportTrips} trip${Number(transaction.transportTrips) === 1 ? '' : 's'}.` : ''}`
      : '';
    return {
      intent,
      title: selected ? `${selected.provider} is selected` : 'Logistics selection',
      message: selected ? `${selected.provider}${selected.type ? ` (${selected.type})` : ''} is selected for the current demo flow.${transaction?.logisticsFee !== undefined && hasNumber(transaction.logisticsFee) ? ` Transaction logistics fee: ${formatPrice(transaction.logisticsFee)}.` : ''}${calculationDetail}` : `${names.length ? `Available options: ${names.join(', ')}.` : 'No logistics options are loaded yet.'}${transaction && !transaction.logisticsOptionId ? ' Please choose a logistics option before scheduling pickup.' : ''}${calculationDetail}`,
      action: 'Open logistics',
      key: 'logistics'
    };
  }

  if (intent === 'payment') {
    const transaction = facts.activeTransaction;
    if (transaction) {
      const payable = formatPrice(numberFrom(transaction.netPayable, transaction.amount));
      if (followUp === 'next') {
        const nextStep = transaction.status === 'confirmed'
          ? (transaction.logisticsOptionId ? 'Logistics is selected, so schedule pickup next.' : 'Please choose a logistics option before scheduling pickup.')
          : transaction.status === 'pickup_scheduled'
            ? 'Pickup is scheduled. The next stage is transit.'
            : transaction.status === 'in_transit'
              ? 'The shipment is in transit. Mark delivery when it reaches the buyer.'
              : transaction.status === 'delivered'
                ? 'Delivery is confirmed. You can now confirm the demo payment received.'
                : 'Review the transaction status in Transactions.';
        return { intent, title: 'Next transaction step', message: nextStep, action: 'Open transactions', key: 'transactions' };
      }
      return {
        intent,
        title: 'Current transaction status',
        message: [`Status: ${readableStatus(transaction.status)}.`, transaction.paymentStatus ? `Payment: ${readableStatus(transaction.paymentStatus)}.` : null, transaction.logisticsProvider ? `Logistics: ${transaction.logisticsProvider}.` : null, payable ? `Backend net payable: ${payable}.` : null, !transaction.logisticsOptionId && transaction.status === 'confirmed' ? 'Choose logistics before scheduling pickup.' : null].filter(Boolean).join(' '),
        action: 'Open transactions',
        key: 'transactions'
      };
    }
    return { intent, title: 'Payment tracking', message: facts.pendingOffers.length ? 'Accept a pending offer to create a transaction. Payment tracking appears after an offer becomes a transaction.' : 'There is no active transaction to track yet.', action: 'Open transactions', key: 'transactions' };
  }

  if (intent === 'earnings') {
    const transaction = facts.activeTransaction;
    const netPayable = formatPrice(transaction?.netPayable);
    const sellNowOption = recommendation.sellNowOption || null;
    const wantsCalculation = /how.*(net|earn|calculate)|net.*(calculate|formula)/.test(query);
    const calculation = wantsCalculation && sellNowOption
      ? [`For ${sellNowOption.name},`, hasNumber(sellNowOption.grossPrice) ? `gross is ${formatPerQuintal(sellNowOption.grossPrice)};` : null, hasNumber(sellNowOption.estimatedLogisticsCost) ? `the backend logistics quote is ${formatPerQuintal(sellNowOption.estimatedLogisticsCost)};` : null, hasNumber(sellNowOption.netPrice) ? `net is ${formatPerQuintal(sellNowOption.netPrice)}.` : null].filter(Boolean).join(' ')
      : null;
    return {
      intent,
      title: 'Net realisation',
      message: calculation || (netPayable ? `The active transaction’s backend net payable is ${netPayable}${transaction?.quantity ? ` for ${transaction.quantity} q` : ''}.` : expectedNet ? `The current backend recommendation reports an expected best net of ${expectedNet}. A total payout is shown once an offer creates a transaction.` : 'Net realisation is not available until the dashboard returns a recommendation or transaction.'),
      action: 'View recommendation',
      key: transaction ? 'transactions' : 'recommendation'
    };
  }

  if (intent === 'lot') {
    const openLots = facts.lots.filter((lot) => lot?.status !== 'closed').length;
    return {
      intent,
      title: 'Create a crop lot',
      message: `${openLots ? `${openLots} open crop lot${openLots === 1 ? '' : 's'} currently appear in My crop lots. ` : ''}Add the crop, quantity, grade, asking price and location. Eligible demo buyer matches are generated after publishing.`,
      action: 'Create a lot',
      key: 'create-lot'
    };
  }

  return {
    intent: 'help',
    title: 'I can help with this dashboard',
    message: 'Ask about the sell/hold recommendation, mandi prices, buyer offers, logistics, payment status, net realisation, or creating a crop lot. I only use the current KisanSetu demo data displayed here.',
    action: 'View recommendation',
    key: 'recommendation'
  };
}

export default function KisanAssistant({ context, onAction, kittyEnabled, onKittyCommand }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [lastIntent, setLastIntent] = useState('');
  const [voiceState, setVoiceState] = useState('idle');
  const [analysing, setAnalysing] = useState(false);
  const [speakingMessage, setSpeakingMessage] = useState(null);
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef(null);
  const recognitionSessionRef = useRef(null);
  const voiceSubmittedRef = useRef(true);
  const fileInputRef = useRef(null);
  const suggestions = useMemo(() => {
    const translated = t('assistant.suggestions', { returnObjects: true });
    return Array.isArray(translated) ? translated : [];
  }, [t, i18n.language]);
  const selectedLanguage = LANGUAGE_OPTIONS.find((language) => language.code === i18n.language) || LANGUAGE_OPTIONS[0];
  const listening = voiceState !== 'idle';

  useEffect(() => () => {
    voiceSubmittedRef.current = true;
    recognitionSessionRef.current?.dispose();
    recognitionSessionRef.current = null;
    recognitionRef.current = null;
    stopSpeech();
  }, []);
  useEffect(() => {
    stopSpeech();
    setSpeakingMessage(null);
  }, [i18n.language]);
  useEffect(() => {
    if (!context?.resetVersion) return;
    setMessages([]);
    setLastIntent('');
    setInput('');
  }, [context?.resetVersion]);

  const messageForCurrentLanguage = (message) => {
    if (message.source === 'price' && message.priceResult) {
      const result = message.priceResult;
      return {
        ...message,
        title: `${t(`crops.${String(result.crop || '').toLowerCase()}`, { defaultValue: result.crop })} · ${t('page.priceTrend')}`,
        message: `${t('page.currentPrice')}: ${formatPerQuintal(result.currentPrice)} · ${t('page.forecastPeak')}: ${formatPerQuintal(result.predictedPeak)}. ${t(result.recommendation === 'hold' ? 'page.holdReason' : 'page.sellReason')} ${t('page.forecastDisclaimer')}`,
        action: t('page.whyRecommendation')
      };
    }
    if (message.intent && message.intent !== 'disease') {
      const localizedContext = message.equipmentSnapshot ? { ...context, equipmentSnapshot: message.equipmentSnapshot, equipmentDemoUserName: message.equipmentSnapshot.demoUserName || context?.equipmentDemoUserName } : context;
      return localizedResponse(message.intent, localizedContext, t, message.question || '', message.followUp || null);
    }
    return message;
  };

  const speak = async (text, messageIndex) => {
    if (!text) return;
    setVoiceError('');
    setSpeakingMessage(messageIndex);
    try {
      await speakText(text, i18n.language, {
        onStateChange: (state) => setSpeakingMessage(state === 'idle' ? null : messageIndex)
      });
    } catch {
      setSpeakingMessage(null);
      setVoiceError(t('assistant.playbackUnavailable'));
    }
  };

  const ask = async (question, forcedIntent = '') => {
    const clean = String(question || input).trim();
    if (!clean) return;
    const kittyCommand = getKittyCommand(clean);
    if (kittyCommand) {
      const enabling = kittyCommand === 'on';
      const alreadyInRequestedState = enabling === kittyEnabled;
      if (!alreadyInRequestedState) onKittyCommand(kittyCommand);
      const reply = enabling
        ? alreadyInRequestedState
          ? '🐱 Kitty effect is already enabled.'
          : '🐱 Kitty effect enabled! Move your cursor around and the kitty will follow you.'
        : alreadyInRequestedState
          ? '🐱 Kitty effect is already disabled.'
          : '🐱 Kitty effect disabled.';
      setMessages((current) => [...current,
        { role: 'farmer', text: clean },
        { role: 'assistant', title: 'KisanSetu', message: reply, action: '', key: '', source: 'kitty' }
      ]);
      setInput('');
      return;
    }
    const resolved = forcedIntent ? { id: forcedIntent === 'price' ? 'recommendation' : forcedIntent, followUp: null } : resolveLocalizedIntent(clean, lastIntent, context, t);
    let responseContext = context;
    let equipmentSnapshot = null;
    if (resolved.id === 'equipment') {
      try {
        const [equipmentResult, rentalResult] = await Promise.all([
          api.getEquipment({}, context?.equipmentDemoUserId || 'farmer-1'),
          api.getEquipmentRentals(context?.equipmentDemoUserId || 'farmer-1')
        ]);
        equipmentSnapshot = { items: equipmentResult.items || [], rentals: rentalResult.rentals || [], demoUserId: context?.equipmentDemoUserId || 'farmer-1', demoUserName: context?.equipmentDemoUserName || '' };
      } catch {
        equipmentSnapshot = { items: [], rentals: [], unavailable: true, demoUserId: context?.equipmentDemoUserId || 'farmer-1', demoUserName: context?.equipmentDemoUserName || '' };
      }
      responseContext = { ...context, equipmentSnapshot };
    }
    let nextMessage = {
      ...response(resolved.id, responseContext, resolved.followUp, clean, t),
      source: 'intent',
      followUp: resolved.followUp,
      question: clean,
      ...(equipmentSnapshot ? { equipmentSnapshot } : {})
    };
    if (forcedIntent === 'price' || /predict|forecast|future price|price prediction/i.test(clean)) {
      try {
        const result = await api.getAdvisorPrice(context?.filters?.crop || 'Onion', 7);
        nextMessage = {
          intent: 'recommendation',
          title: `${t(`crops.${String(result.crop || '').toLowerCase()}`, { defaultValue: result.crop })} · ${t('page.priceTrend')}`,
          message: `${t('page.currentPrice')}: ${formatPerQuintal(result.currentPrice)} · ${t('page.forecastPeak')}: ${formatPerQuintal(result.predictedPeak)}. ${t(result.recommendation === 'hold' ? 'page.holdReason' : 'page.sellReason')} ${t('page.forecastDisclaimer')}`,
          action: t('page.whyRecommendation'),
          key: 'recommendation',
          source: 'price',
          priceResult: result
        };
      } catch (error) {
        nextMessage = { ...nextMessage, message: `${nextMessage.message} ${t('assistant.disclaimer')}` };
      }
    }
    setMessages((current) => [...current, { role: 'farmer', text: clean }, { role: 'assistant', ...nextMessage }]);
    setLastIntent(nextMessage.intent);
    setInput('');
  };

  const toggleListening = () => {
    const activeSession = recognitionSessionRef.current;
    if (activeSession) {
      activeSession.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError(t('assistant.unsupported'));
      return;
    }

    setVoiceError('');
    setSpeakingMessage(null);
    voiceSubmittedRef.current = false;

    const recognition = new SpeechRecognition();
    recognition.lang = getSpeechLocale(i18n.language);
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    let session;
    session = createSpeechRecognitionSession({
      recognition,
      submissionRef: voiceSubmittedRef,
      isCurrent: () => recognitionSessionRef.current === session,
      initialText: input,
      onListeningChange: (active) => setVoiceState(active ? 'listening' : 'idle'),
      onProcessing: () => setVoiceState('processing'),
      onComposerChange: setInput,
      onSubmit: (transcript) => void ask(transcript),
      onError: (error) => setVoiceError(t(speechRecognitionErrorKey(error))),
      onComplete: () => {
        if (recognitionSessionRef.current !== session) return;
        recognitionSessionRef.current = null;
        recognitionRef.current = null;
      }
    });
    recognitionRef.current = recognition;
    recognitionSessionRef.current = session;
    startRecognitionAfterStoppingPlayback(stopSpeech, session);
  };

  const analyseImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setVoiceError(t('assistant.imageInvalid'));
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setVoiceError(t('assistant.imageTooLarge'));
      return;
    }
    setAnalysing(true);
    setVoiceError('');
    try {
      const result = await api.analyzeCropImage(file, context?.filters?.crop);
      setMessages((current) => [...current,
        { role: 'farmer', text: `${t('assistant.photo')}: ${file.name}` },
        { role: 'assistant', ...cropImageAssistantMessage(result, t) }
      ]);
    } catch (error) {
      setVoiceError(t('assistant.imageAnalysisUnavailable'));
    } finally {
      setAnalysing(false);
    }
  };

  return <aside className={`kisan-assistant ${open ? 'open' : ''}`} aria-label="KisanSetu Assistant">
    {open && <section className="assistant-panel">
      <header><span className="assistant-avatar"><Bot size={18}/></span><div><strong>{t('assistant.title')}</strong><small>{t('assistant.subtitle')}</small></div><button type="button" aria-label={t('assistant.close')} onClick={() => setOpen(false)}><X size={18}/></button></header>
      <div className="assistant-tools">
        <span className="assistant-language" aria-label={t('page.language')}>{selectedLanguage.label}</span>
        <button type="button" className={listening ? 'active' : ''} onClick={toggleListening}>{listening ? <MicOff size={14}/> : <Mic size={14}/>}<span>{listening ? t('assistant.stop') : t('assistant.listen')}</span></button>
        <button type="button" disabled={analysing} onClick={() => fileInputRef.current?.click()}><ImagePlus size={14}/><span>{analysing ? t('assistant.analyzing') : t('assistant.photo')}</span></button>
        <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={analyseImage}/>
      </div>
      {listening && <p className="assistant-state"><Mic size={13}/>{t('assistant.listening')}</p>}
      {voiceError && <p className="assistant-error" role="alert">{voiceError}</p>}
      <div className="assistant-messages" aria-live="polite">{messages.length ? messages.map((message, index) => {
        if (message.role === 'farmer') return <p className="assistant-question" key={index}>{message.text}</p>;
        const localized = messageForCurrentLanguage(message);
        return <article key={index}><strong>{localized.title}</strong><p>{localized.message}</p><div className="assistant-message-actions">{localized.action && <button type="button" onClick={() => onAction(localized.key)}>{localized.action}</button>}<button type="button" className={`speak-button ${speakingMessage === index ? 'active' : ''}`} aria-label={t('assistant.read')} aria-busy={speakingMessage === index} onClick={() => speak(localized.message, index)}><Volume2 size={14}/></button></div></article>;
      }) : <article><strong>{t('assistant.hello')}</strong><p>{t('assistant.intro')}</p></article>}</div>
      <div className="assistant-suggestions">{suggestions.map((suggestion, index) => <button type="button" key={suggestion} onClick={() => index === 3 ? fileInputRef.current?.click() : ask(suggestion, ['recommendation', 'price', 'market'][index])}>{suggestion}</button>)}</div>
      <form onSubmit={(event) => { event.preventDefault(); ask(input); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder={t('assistant.placeholder')} aria-label={t('assistant.title')}/><button aria-label={t('page.submit')}><Send size={16}/></button></form>
      <p className="assistant-disclaimer">{t('assistant.disclaimer')}</p>
    </section>}
    <button type="button" className="assistant-fab" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={21}/> : <MessageCircle size={22}/>}<span>{open ? t('assistant.close') : t('assistant.open')}</span></button>
  </aside>;
}

import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { useMemo, useState } from 'react';

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
    lots: Array.isArray(context?.lots) ? context.lots : []
  };
}

function response(intent, context, followUp, question = '') {
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

export default function KisanAssistant({ context, onAction }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [lastIntent, setLastIntent] = useState('');
  const suggestions = useMemo(() => ['Should I sell now?', 'Which market is best?', 'Show buyer offers', 'How does payment work?'], []);
  const ask = (question) => {
    const clean = String(question || input).trim();
    if (!clean) return;
    const resolved = resolveIntent(clean, lastIntent, context);
    const nextMessage = response(resolved.id, context, resolved.followUp, clean);
    setMessages((current) => [...current, { role: 'farmer', text: clean }, { role: 'assistant', ...nextMessage }]);
    setLastIntent(nextMessage.intent);
    setInput('');
  };

  return <aside className={`kisan-assistant ${open ? 'open' : ''}`} aria-label="KisanSetu Assistant">
    {open && <section className="assistant-panel"><header><span className="assistant-avatar"><Bot size={18}/></span><div><strong>KisanSetu Assistant</strong><small>Uses your current demo dashboard data</small></div><button type="button" aria-label="Close assistant" onClick={() => setOpen(false)}><X size={18}/></button></header><div className="assistant-messages" aria-live="polite">{messages.length ? messages.map((message, index) => message.role === 'farmer' ? <p className="assistant-question" key={index}>{message.text}</p> : <article key={index}><strong>{message.title}</strong><p>{message.message}</p><button type="button" onClick={() => onAction(message.key)}>{message.action}</button></article>) : <article><strong>How can I help?</strong><p>I can explain the best selling decision using your selected crop, nearby markets, buyer offers, logistics and payment status.</p></article>}</div><div className="assistant-suggestions">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => ask(suggestion)}>{suggestion}</button>)}</div><form onSubmit={(event) => { event.preventDefault(); ask(); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about your sale…" aria-label="Ask KisanSetu Assistant"/><button aria-label="Send question"><Send size={16}/></button></form><p className="assistant-disclaimer">Demo assistant: deterministic guidance based on the displayed sample data, not live market advice.</p></section>}
    <button type="button" className="assistant-fab" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={21}/> : <MessageCircle size={22}/>}<span>{open ? 'Close' : 'Ask KisanSetu'}</span></button>
  </aside>;
}

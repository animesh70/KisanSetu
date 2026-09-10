import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { useMemo, useState } from 'react';

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

function answerFor(question, context) {
  const text = question.toLowerCase();
  const recommendation = context.data?.recommendation || {};
  const bestMarket = [...(context.data?.prices || [])].sort((a, b) => (b.netRealisation ?? b.modalPrice) - (a.netRealisation ?? a.modalPrice))[0];
  const bestBuyer = recommendation.recommendedBuyer;
  const pendingOffers = (context.offers || []).filter((offer) => offer.status === 'pending');
  const activeTransaction = (context.transactions || []).find((transaction) => transaction.status !== 'completed');

  if (/sell|hold|wait|recommend/.test(text)) {
    const isHold = recommendation.action === 'hold';
    return { title: isHold ? 'Recommended: hold briefly' : 'Recommended: sell now', message: isHold ? `The current demo model suggests waiting about ${recommendation.daysToPeak || 1} day(s). Expected best net: ${formatPrice(recommendation.expectedNetPrice)}/q after estimated costs.` : `The current demo model suggests selling now. Best estimated net: ${formatPrice(recommendation.expectedNetPrice)}/q after logistics.`, action: isHold ? 'Create a lot' : 'View buyer offers', key: isHold ? 'create-lot' : 'offers' };
  }
  if (/market|mandi|price|rate/.test(text)) {
    return { title: 'Best nearby market option', message: bestMarket ? `${bestMarket.mandiName} is ${bestMarket.distanceKm} km away. Market price is ${formatPrice(bestMarket.modalPrice)}/q; estimated net is ${formatPrice(bestMarket.netRealisation ?? bestMarket.modalPrice)}/q.` : 'Market information is loading. Try again in a moment.', action: 'View market prices', key: 'market' };
  }
  if (/buyer|match|offer/.test(text)) {
    return { title: pendingOffers.length ? `${pendingOffers.length} offer waiting` : 'Buyer matching', message: bestBuyer ? `${bestBuyer.name} is the best verified demo buyer match at ${formatPrice(bestBuyer.offerPrice)}/q. Ranking considers price, distance, quantity, grade and reliability.` : 'No eligible buyer match is available for this crop yet.', action: 'View buyer offers', key: 'offers' };
  }
  if (/transport|logistic|pickup|storage/.test(text)) {
    const selected = context.selectedService;
    return { title: selected ? `${selected.provider} selected` : 'Choose logistics before pickup', message: selected ? `${selected.type} is selected for the current demo flow. Its estimated fee will be included in the transaction breakdown.` : 'Choose Kisan Haul for transport or Nashik Cold Store for storage before scheduling pickup.', action: 'Open logistics', key: 'logistics' };
  }
  if (/payment|transaction|paid|delivery/.test(text)) {
    return { title: activeTransaction ? 'Transaction in progress' : 'Payment tracking', message: activeTransaction ? `Current status: ${activeTransaction.status.replaceAll('_', ' ')}. Payment is marked received only after delivery in this demo flow.` : 'Accept an offer to create a transaction, arrange logistics, then track delivery and payment here.', action: 'Open transactions', key: 'transactions' };
  }
  if (/lot|crop|publish/.test(text)) {
    return { title: 'Create a crop lot', message: `Add your ${context.filters?.crop || 'crop'}, quantity, grade, asking price and pickup location. The platform will then show eligible demo buyer matches.`, action: 'Create a lot', key: 'create-lot' };
  }
  return { title: 'I can help you decide', message: 'Ask about selling now, the best market, buyer offers, logistics, payments, or creating a crop lot. I use the current KisanSetu demo data shown on this dashboard.', action: 'Show recommendation', key: 'recommendation' };
}

export default function KisanAssistant({ context, onAction }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const suggestions = useMemo(() => ['Should I sell now?', 'Which market is best?', 'Show buyer offers', 'How does payment work?'], []);
  const ask = (question) => {
    const clean = String(question || input).trim();
    if (!clean) return;
    const response = answerFor(clean, context);
    setMessages((current) => [...current, { role: 'farmer', text: clean }, { role: 'assistant', ...response }]);
    setInput('');
  };
  return <aside className={`kisan-assistant ${open ? 'open' : ''}`} aria-label="KisanSetu Assistant">
    {open && <section className="assistant-panel"><header><span className="assistant-avatar"><Bot size={18}/></span><div><strong>KisanSetu Assistant</strong><small>Uses your current demo dashboard data</small></div><button type="button" aria-label="Close assistant" onClick={() => setOpen(false)}><X size={18}/></button></header><div className="assistant-messages" aria-live="polite">{messages.length ? messages.map((message, index) => message.role === 'farmer' ? <p className="assistant-question" key={index}>{message.text}</p> : <article key={index}><strong>{message.title}</strong><p>{message.message}</p><button type="button" onClick={() => onAction(message.key)}>{message.action}</button></article>) : <article><strong>How can I help?</strong><p>I can explain the best selling decision using your selected crop, nearby markets, buyer offers, logistics and payment status.</p></article>}</div><div className="assistant-suggestions">{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => ask(suggestion)}>{suggestion}</button>)}</div><form onSubmit={(event) => { event.preventDefault(); ask(); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about your sale…" aria-label="Ask KisanSetu Assistant"/><button aria-label="Send question"><Send size={16}/></button></form><p className="assistant-disclaimer">Demo assistant: guidance is based on the displayed sample data, not live market advice.</p></section>}
    <button type="button" className="assistant-fab" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={21}/> : <MessageCircle size={22}/>}<span>{open ? 'Close' : 'Ask KisanSetu'}</span></button>
  </aside>;
}

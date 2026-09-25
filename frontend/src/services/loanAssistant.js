export const LOAN_PURPOSES = ['crop_cultivation', 'farm_equipment', 'irrigation', 'dairy_livestock', 'fisheries', 'storage_warehouse', 'agri_business', 'working_capital', 'other'];
export const FARMER_TYPES = ['owner_cultivator', 'tenant_farmer', 'sharecropper', 'farmer_group', 'fpo', 'other'];

const normalized = (text) => String(text || '').toLocaleLowerCase().normalize('NFKC').replace(/[\p{P}\p{S}]/gu, ' ').replace(/\s+/g, ' ').trim();

export function detectLoanPurpose(text, t) {
  const value = normalized(text);
  if (!value) return null;
  const patterns = [
    ['farm_equipment', /tractor|equipment|machinery|harvester|ट्रैक्टर|ट्रॅक्टर|ଟ୍ରାକ୍ଟର|ট্র্যাক্টর|ટ્રેક્ટર|ట్రాక్టర్|டிராக்டர்|ٹریکٹر|tracto|traktör/iu],
    ['irrigation', /irrigat|drip|पानी|सिंचाई|ସେଚନ|সেচ|સિંચાઈ|నీటిపారుదల|நீர்ப்பாசனம்|آبپاشی|riego|sulama/iu],
    ['dairy_livestock', /dairy|livestock|cattle|cow|डेयरी|दूध|ଦୁଗ୍ଧ|দুগ্ধ|ડેરી|పాడి|பால்|ڈیری|ganado|süt/iu],
    ['fisheries', /fish|aquaculture|मछली|ମାଛ|মাছ|માછલી|చేప|மீன்|مچھلی|pesca|balık/iu],
    ['storage_warehouse', /warehouse|storage|cold store|गोदाम|भंडारण|ଗୋଦାମ|গুদাম|ગોડાઉન|గిడ్డంగి|கிடங்கு|گودام|almacén|depo/iu],
    ['agri_business', /agri business|agribusiness|processing|कृषि व्यवसाय|କୃଷି ବ୍ୟବସାୟ|কৃষি ব্যবসা|કૃષિ વ્યવસાય|వ్యవసాయ వ్యాపారం|வேளாண் வணிகம்|زرعی کاروبار|negocio agrícola|tarım işletmesi/iu],
    ['working_capital', /working capital|farm expenses|कार्यशील पूंजी|କାର୍ଯ୍ୟକାରୀ ପୁଞ୍ଜି|চলতি মূলধন|કાર્યકારી મૂડી|నిర్వహణ మూలధనం|செயல்பாட்டு மூலதனம்|ورکنگ کیپیٹل|capital de trabajo|işletme sermayesi/iu],
    ['crop_cultivation', /crop|cultivat|seed|fertili|kcc|kisan credit|फसल|खेती|बीज|किसान क्रेडिट|पीक|ଶସ୍ୟ|ଫସଲ|ଚାଷ|বীজ|ফসল|চাষ|પાક|ખેતી|విత్తన|పంట|விதை|பயிர்|فصل|بیج|cultivo|semilla|ürün|tohum/iu]
  ];
  for (const [purpose, pattern] of patterns) if (pattern.test(value)) return purpose;
  for (const purpose of LOAN_PURPOSES) if (value.includes(normalized(t(`loans.purpose.${purpose}`)))) return purpose;
  return null;
}

export function detectEquipmentActivity(text, t) {
  const value = normalized(text);
  if (/tractor|ट्रैक्टर|ट्रॅक्टर|ଟ୍ରାକ୍ଟର|ট্র্যাক্টর|ટ્રેક્ટર|ట్రాక్టర్|டிராக்டர்|ٹریکٹر|tracto|traktör/iu.test(value) || value.includes(normalized(t('loans.equipment.tractor')))) return 'tractor';
  if (/harvester|sprayer|seeder|machinery|equipment|other machine/iu.test(value) || value.includes(normalized(t('loans.equipment.other')))) return 'other_equipment';
  return null;
}

export function detectLoanCrop(text) {
  const value = normalized(text);
  const crops = [['Onion', /onion|प्याज|प्याज़|कांदा|ପିଆଜ|পেঁয়াজ|ડુંગળી|ఉల్లిపాయ|வெங்காயம்|پیاز|cebolla|soğan/iu], ['Tomato', /tomato|टमाटर|टोमॅटो|ଟମାଟୋ|টমেটো|ટામેટા|టమాటా|தக்காளி|ٹماٹر|tomate|domates/iu], ['Potato', /potato|आलू|बटाटा|ଆଳୁ|আলু|બટાકા|బంగాళదుంప|உருளைக்கிழங்கு|آلو|patata|patates/iu], ['Soybean', /soybean|सोयाबीन|ସୋୟାବିନ|সয়াবিন|સોયાબીન|సోయాబీన్|சோயாபீன்|سویابین|soja|soya/iu]];
  return crops.find(([, pattern]) => pattern.test(value))?.[0] || null;
}

export function isLoanRequest(text, t) {
  const value = normalized(text);
  return /\b(loan|loans|borrow|credit|financ|kcc|bank loans?|need money|money to buy)\b|ऋण|कर्ज|क़र्ज़|କୃଷି ଋଣ|ଋଣ|ঋণ|લોન|రుణం|கடன்|قرض|préstamo|kredi/iu.test(value) || value.includes(normalized(t('loans.quickAction')));
}

export function parseLoanAmount(text) {
  const value = String(text || '').replace(/[₹,\s]/g, '').toLocaleLowerCase();
  const match = value.match(/(\d+(?:\.\d+)?)(crore|cr|करोड़|कोटी|କୋଟି|কোটি|કરોડ|కోటి|கோடி|کروڑ|lakh|lac|लाख|ଲକ୍ଷ|লাখ|લાખ|లక్ష|லட்சம்|لاکھ|k|हजार|हज़ार|ହଜାର|হাজার|હજાર|వేలు|ஆயிரம்|ہزار)?/iu);
  if (!match) return null;
  const unit = match[2] || '';
  const multiplier = /crore|cr|करोड़|कोटी|କୋଟି|কোটি|કરોડ|కోటి|கோடி|کروڑ/iu.test(unit) ? 10000000 : /lakh|lac|लाख|ଲକ୍ଷ|লাখ|લાખ|లక్ష|லட்சம்|لاکھ/iu.test(unit) ? 100000 : /k|हजार|हज़ार|ହଜାର|হাজার|હજાર|వేలు|ஆயிரம்|ہزار/iu.test(unit) ? 1000 : 1;
  const amount = Number(match[1]) * multiplier;
  return Number.isSafeInteger(amount) && amount > 0 && amount <= 1000000000 ? amount : null;
}

export function detectFarmerType(text, t) {
  const value = normalized(text);
  const patterns = {
    owner_cultivator: /owner|own land|landowner|भूमि मालिक|जमीन मालिक|मालक|ଜମି ମାଲିକ|জমির মালিক|જમીન માલિક|భూమి యజమాని|நில உரிமையாளர்|مالک|propietario|sahip/iu,
    tenant_farmer: /tenant|lease|leased|rented land|किरायेदार|पट्टेदार|भाडेकरू|ଭଡ଼ା ଚାଷୀ|ভাড়াটে|ભાડૂત|కౌలు|குத்தகை|مزارع|arrendatario|kiracı/iu,
    sharecropper: /sharecrop|बटाईदार|ହିସ୍ସା ଚାଷୀ|বর্গাচাষী|ભાગિયા|பங்கு விவசாயி|مزارعت|aparcero/iu,
    farmer_group: /jlg|shg|farmer group|किसान समूह|ଶ୍ରେଣୀ|কৃষক দল|ખેડૂત જૂથ|రైతు సమూహం|விவசாயிகள் குழு|کسان گروپ|grupo de agricultores|çiftçi grubu/iu,
    fpo: /\bfpo\b|producer organization|उत्पादक संगठन|ଉତ୍ପାଦକ ସଂଗଠନ|উৎপাদক সংগঠন|ઉત્પાદક સંસ્થા|ఉత్పత్తిదారుల సంస్థ|உற்பத்தியாளர் அமைப்பு|تنظیم/iu
  };
  for (const type of FARMER_TYPES) if (patterns[type]?.test(value) || value.includes(normalized(t(`loans.farmerType.${type}`)))) return type;
  return null;
}

export function officialApplicationUrl(loan) {
  try {
    const url = new URL(loan?.applicationUrl);
    return url.protocol === 'https:' && ['sbi.bank.in', 'www.rbi.org.in'].includes(url.hostname) ? url.href : null;
  } catch { return null; }
}

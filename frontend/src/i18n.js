import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pageTranslations from './localization/pageTranslations.js';

export const LANGUAGE_OPTIONS = [
  { code: 'en', locale: 'en-IN', label: 'English' },
  { code: 'hi', locale: 'hi-IN', label: 'हिन्दी' },
  { code: 'mr', locale: 'mr-IN', label: 'मराठी' },
  { code: 'ur', locale: 'ur-IN', label: 'اردو' },
  { code: 'tr', locale: 'tr-TR', label: 'Türkçe' },
  { code: 'es', locale: 'es-ES', label: 'Español' },
  { code: 'pa', locale: 'pa-IN', label: 'ਪੰਜਾਬੀ' },
  { code: 'or', locale: 'or-IN', label: 'ଓଡ଼ିଆ' },
  { code: 'bn', locale: 'bn-IN', label: 'বাংলা' },
  { code: 'gu', locale: 'gu-IN', label: 'ગુજરાતી' },
  { code: 'te', locale: 'te-IN', label: 'తెలుగు' },
  { code: 'ta', locale: 'ta-IN', label: 'தமிழ்' }
];

const en = {
  brandSubtitle: 'Market intelligence', greeting: 'GOOD MORNING, SANJAY', headline: 'Make every harvest count.',
  heroEyebrow: 'SELL SMARTER WITH KISANSETU', heroTitle: 'Find the right buyer at the right time.',
  heroBody: 'Compare nearby mandi rates, receive verified buyer offers and know your best selling window.',
  createLot: 'Create crop lot', opportunity: 'Check your selling opportunity', crop: 'Crop', location: 'Location', quantity: 'Quantity (q)', checkPrices: 'Check prices', checking: 'Checking…', reset: 'Reset demo',
  nav: { dashboard: 'Dashboard', markets: 'Market prices', lots: 'My crop lots', buyers: 'Buyer matches', logistics: 'Logistics', transactions: 'Transactions' },
  assistant: { title: 'KisanSetu Advisor', subtitle: 'Voice, prices and crop health', open: 'Ask KisanSetu', close: 'Close', hello: 'How can I help?', intro: 'Ask about selling decisions, mandi prices, buyer offers, logistics, payments, or upload a crop photo.', placeholder: 'Ask about your crop or sale…', listen: 'Speak', stop: 'Stop', photo: 'Crop photo', read: 'Read aloud', analyzing: 'Analysing image…', listening: 'Listening…', unsupported: 'Voice recognition is not supported in this browser.', disclaimer: 'Price guidance uses current prototype data. Image screening is a mock aid and requires expert confirmation.', suggestions: ['Should I sell now?', 'Predict my crop price', 'Which market is best?', 'Check a crop photo'] }
};

const resources = {
  en: { translation: en },
  hi: { translation: { ...en, brandSubtitle: 'बाज़ार बुद्धिमत्ता', greeting: 'सुप्रभात, संजय', headline: 'हर फसल का पूरा लाभ लें।', heroEyebrow: 'किसानसेतु के साथ समझदारी से बेचें', heroTitle: 'सही समय पर सही खरीदार खोजें।', heroBody: 'पास की मंडी दरें, खरीदार प्रस्ताव और बेचने का सही समय देखें।', createLot: 'फसल लॉट बनाएँ', opportunity: 'बेचने का अवसर जाँचें', crop: 'फसल', location: 'स्थान', quantity: 'मात्रा (क्विंटल)', checkPrices: 'भाव जाँचें', checking: 'जाँच जारी…', reset: 'डेमो रीसेट', nav: { dashboard: 'डैशबोर्ड', markets: 'मंडी भाव', lots: 'मेरे फसल लॉट', buyers: 'खरीदार मिलान', logistics: 'परिवहन', transactions: 'लेन-देन' }, assistant: { ...en.assistant, title: 'किसानसेतु सलाहकार', subtitle: 'आवाज़, भाव और फसल स्वास्थ्य', open: 'किसानसेतु से पूछें', close: 'बंद करें', hello: 'मैं कैसे मदद करूँ?', intro: 'बेचने, मंडी भाव, खरीदार, परिवहन, भुगतान या फसल फोटो के बारे में पूछें।', placeholder: 'फसल या बिक्री के बारे में पूछें…', listen: 'बोलें', stop: 'रोकें', photo: 'फसल फोटो', read: 'सुनें', analyzing: 'फोटो जाँची जा रही है…', listening: 'सुन रहा हूँ…', unsupported: 'इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है।', disclaimer: 'भाव मार्गदर्शन प्रोटोटाइप डेटा पर आधारित है। फोटो जाँच मॉक है; विशेषज्ञ पुष्टि ज़रूरी है।', suggestions: ['क्या अभी बेचूँ?', 'फसल का भाव बताएँ', 'सबसे अच्छी मंडी?', 'फसल फोटो जाँचें'] } } },
  mr: { translation: { ...en, brandSubtitle: 'बाजार माहिती', greeting: 'शुभ सकाळ, संजय', headline: 'प्रत्येक पिकाचे पूर्ण मूल्य मिळवा.', heroEyebrow: 'किसानसेतूसोबत हुशारीने विका', heroTitle: 'योग्य वेळी योग्य खरेदीदार शोधा.', heroBody: 'जवळचे मंडी भाव, खरेदीदार ऑफर आणि विक्रीची योग्य वेळ पहा.', createLot: 'पीक लॉट तयार करा', opportunity: 'विक्रीची संधी तपासा', crop: 'पीक', location: 'ठिकाण', quantity: 'प्रमाण (क्विंटल)', checkPrices: 'भाव तपासा', checking: 'तपासत आहे…', reset: 'डेमो रीसेट', nav: { dashboard: 'डॅशबोर्ड', markets: 'बाजार भाव', lots: 'माझे पीक लॉट', buyers: 'खरेदीदार जुळणी', logistics: 'वाहतूक', transactions: 'व्यवहार' }, assistant: { ...en.assistant, title: 'किसानसेतू सल्लागार', subtitle: 'आवाज, भाव आणि पीक आरोग्य', open: 'किसानसेतूला विचारा', close: 'बंद', hello: 'मी कशी मदत करू?', intro: 'विक्री, मंडी भाव, खरेदीदार, वाहतूक, पैसे किंवा पीक फोटोबद्दल विचारा.', placeholder: 'पीक किंवा विक्रीबद्दल विचारा…', listen: 'बोला', stop: 'थांबा', photo: 'पीक फोटो', read: 'ऐका', analyzing: 'फोटो तपासत आहे…', listening: 'ऐकत आहे…', unsupported: 'या ब्राउझरमध्ये आवाज ओळख उपलब्ध नाही.', disclaimer: 'भाव मार्गदर्शन प्रोटोटाइप डेटावर आहे. फोटो तपासणी मॉक आहे; तज्ज्ञ पुष्टी आवश्यक.', suggestions: ['आता विकावे का?', 'पिकाचा भाव सांगा', 'सर्वोत्तम बाजार?', 'पीक फोटो तपासा'] } } },
  ur: { translation: { ...en, brandSubtitle: 'مارکیٹ کی معلومات', greeting: 'صبح بخیر، سنجے', headline: 'ہر فصل کی پوری قدر حاصل کریں۔', heroEyebrow: 'کسان سیتو کے ساتھ بہتر فروخت', heroTitle: 'صحیح وقت پر صحیح خریدار تلاش کریں۔', heroBody: 'قریبی منڈی کے نرخ، خریدار کی پیشکش اور فروخت کا بہتر وقت دیکھیں۔', createLot: 'فصل لاٹ بنائیں', opportunity: 'فروخت کا موقع دیکھیں', crop: 'فصل', location: 'مقام', quantity: 'مقدار (کوئنٹل)', checkPrices: 'قیمت دیکھیں', checking: 'جانچ جاری…', reset: 'ڈیمو ری سیٹ', nav: { dashboard: 'ڈیش بورڈ', markets: 'منڈی قیمتیں', lots: 'میری فصل لاٹس', buyers: 'خریدار میچ', logistics: 'نقل و حمل', transactions: 'لین دین' }, assistant: { ...en.assistant, title: 'کسان سیتو مشیر', subtitle: 'آواز، قیمت اور فصل کی صحت', open: 'کسان سیتو سے پوچھیں', close: 'بند کریں', hello: 'میں کیسے مدد کروں؟', intro: 'فروخت، منڈی قیمت، خریدار، نقل و حمل، ادائیگی یا فصل کی تصویر کے بارے میں پوچھیں۔', placeholder: 'فصل یا فروخت کے بارے میں پوچھیں…', listen: 'بولیں', stop: 'روکیں', photo: 'فصل تصویر', read: 'سنیں', analyzing: 'تصویر دیکھی جا رہی ہے…', listening: 'سن رہا ہوں…', unsupported: 'اس براؤزر میں آواز کی شناخت دستیاب نہیں۔', disclaimer: 'قیمت رہنمائی پروٹوٹائپ ڈیٹا پر ہے۔ تصویری جانچ فرضی ہے؛ ماہر کی تصدیق ضروری ہے۔', suggestions: ['کیا ابھی فروخت کروں؟', 'فصل کی قیمت بتائیں', 'بہترین منڈی؟', 'فصل تصویر دیکھیں'] } } },
  tr: { translation: { ...en, brandSubtitle: 'Pazar zekâsı', greeting: 'GÜNAYDIN, SANJAY', headline: 'Her hasadı değerlendirin.', heroEyebrow: 'KISANSETU İLE AKILLI SATIŞ', heroTitle: 'Doğru alıcıyı doğru zamanda bulun.', heroBody: 'Yakındaki pazar fiyatlarını, alıcı tekliflerini ve en uygun satış zamanını karşılaştırın.', createLot: 'Ürün partisi oluştur', opportunity: 'Satış fırsatını kontrol et', crop: 'Ürün', location: 'Konum', quantity: 'Miktar (q)', checkPrices: 'Fiyatları kontrol et', checking: 'Kontrol ediliyor…', reset: 'Demoyu sıfırla', nav: { dashboard: 'Panel', markets: 'Pazar fiyatları', lots: 'Ürün partilerim', buyers: 'Alıcı eşleşmeleri', logistics: 'Lojistik', transactions: 'İşlemler' }, assistant: { ...en.assistant, title: 'KisanSetu Danışmanı', subtitle: 'Ses, fiyatlar ve ürün sağlığı', open: "KisanSetu'ya sor", close: 'Kapat', hello: 'Nasıl yardımcı olabilirim?', intro: 'Satış kararı, fiyat, alıcı, lojistik, ödeme veya ürün fotoğrafı hakkında sorun.', placeholder: 'Ürününüz veya satışınız hakkında sorun…', listen: 'Konuş', stop: 'Durdur', photo: 'Ürün fotoğrafı', read: 'Sesli oku', analyzing: 'Görüntü inceleniyor…', listening: 'Dinliyorum…', unsupported: 'Bu tarayıcı ses tanımayı desteklemiyor.', disclaimer: 'Fiyat rehberliği prototip verisini kullanır. Görüntü taraması temsili olup uzman onayı gerektirir.', suggestions: ['Şimdi satmalı mıyım?', 'Ürün fiyatını tahmin et', 'En iyi pazar hangisi?', 'Ürün fotoğrafını kontrol et'] } } },
  es: { translation: { ...en, brandSubtitle: 'Inteligencia de mercado', greeting: 'BUENOS DÍAS, SANJAY', headline: 'Haz que cada cosecha cuente.', heroEyebrow: 'VENDE MEJOR CON KISANSETU', heroTitle: 'Encuentra al comprador adecuado en el momento adecuado.', heroBody: 'Compara precios cercanos, ofertas de compradores y la mejor ventana de venta.', createLot: 'Crear lote de cultivo', opportunity: 'Consulta tu oportunidad de venta', crop: 'Cultivo', location: 'Ubicación', quantity: 'Cantidad (q)', checkPrices: 'Consultar precios', checking: 'Consultando…', reset: 'Restablecer demo', nav: { dashboard: 'Panel', markets: 'Precios de mercado', lots: 'Mis lotes', buyers: 'Compradores', logistics: 'Logística', transactions: 'Transacciones' }, assistant: { ...en.assistant, title: 'Asesor KisanSetu', subtitle: 'Voz, precios y salud del cultivo', open: 'Pregunta a KisanSetu', close: 'Cerrar', hello: '¿Cómo puedo ayudarte?', intro: 'Pregunta sobre venta, precios, compradores, logística, pagos o sube una foto del cultivo.', placeholder: 'Pregunta sobre tu cultivo o venta…', listen: 'Hablar', stop: 'Detener', photo: 'Foto del cultivo', read: 'Leer en voz alta', analyzing: 'Analizando imagen…', listening: 'Escuchando…', unsupported: 'El reconocimiento de voz no está disponible en este navegador.', disclaimer: 'La guía de precios usa datos de prototipo. El análisis de imagen es simulado y requiere confirmación experta.', suggestions: ['¿Vendo ahora?', 'Predice el precio', '¿Mejor mercado?', 'Revisar foto del cultivo'] } } },
  pa: { translation: { ...en, brandSubtitle: 'ਮੰਡੀ ਜਾਣਕਾਰੀ', greeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਸੰਜੇ', headline: 'ਹਰ ਫਸਲ ਦਾ ਪੂਰਾ ਮੁੱਲ ਲਵੋ।', heroTitle: 'ਸਹੀ ਸਮੇਂ ਸਹੀ ਖਰੀਦਦਾਰ ਲੱਭੋ।', createLot: 'ਫਸਲ ਲਾਟ ਬਣਾਓ', opportunity: 'ਵਿਕਰੀ ਮੌਕਾ ਵੇਖੋ', crop: 'ਫਸਲ', location: 'ਥਾਂ', quantity: 'ਮਾਤਰਾ (ਕੁਇੰਟਲ)', checkPrices: 'ਭਾਅ ਵੇਖੋ', reset: 'ਡੈਮੋ ਰੀਸੈੱਟ', nav: { dashboard: 'ਡੈਸ਼ਬੋਰਡ', markets: 'ਮੰਡੀ ਭਾਅ', lots: 'ਮੇਰੇ ਲਾਟ', buyers: 'ਖਰੀਦਦਾਰ', logistics: 'ਆਵਾਜਾਈ', transactions: 'ਲੈਣ-ਦੇਣ' }, assistant: { ...en.assistant, title: 'ਕਿਸਾਨਸੇਤੂ ਸਲਾਹਕਾਰ', open: 'ਕਿਸਾਨਸੇਤੂ ਨੂੰ ਪੁੱਛੋ', close: 'ਬੰਦ', hello: 'ਮੈਂ ਕਿਵੇਂ ਮਦਦ ਕਰਾਂ?', listen: 'ਬੋਲੋ', stop: 'ਰੋਕੋ', photo: 'ਫਸਲ ਫੋਟੋ', read: 'ਸੁਣੋ', listening: 'ਸੁਣ ਰਿਹਾ ਹਾਂ…' } } },
  or: { translation: { ...en, brandSubtitle: 'ବଜାର ସୂଚନା', greeting: 'ଶୁଭ ସକାଳ, ସଞ୍ଜୟ', headline: 'ପ୍ରତ୍ୟେକ ଫସଲର ସଠିକ୍ ମୂଲ୍ୟ ପାଆନ୍ତୁ।', heroTitle: 'ଠିକ୍ ସମୟରେ ଠିକ୍ କ୍ରେତା ଖୋଜନ୍ତୁ।', createLot: 'ଫସଲ ଲଟ୍ ତିଆରି', opportunity: 'ବିକ୍ରୟ ସୁଯୋଗ ଦେଖନ୍ତୁ', crop: 'ଫସଲ', location: 'ସ୍ଥାନ', quantity: 'ପରିମାଣ (କ୍ୱିଣ୍ଟାଲ)', checkPrices: 'ଦର ଦେଖନ୍ତୁ', reset: 'ଡେମୋ ରିସେଟ୍', nav: { dashboard: 'ଡ୍ୟାସବୋର୍ଡ', markets: 'ମଣ୍ଡି ଦର', lots: 'ମୋ ଲଟ୍', buyers: 'କ୍ରେତା ମେଳ', logistics: 'ପରିବହନ', transactions: 'କାରବାର' }, assistant: { ...en.assistant, title: 'କିସାନସେତୁ ପରାମର୍ଶଦାତା', open: 'କିସାନସେତୁକୁ ପଚାରନ୍ତୁ', close: 'ବନ୍ଦ', hello: 'ମୁଁ କିପରି ସାହାଯ୍ୟ କରିବି?', listen: 'କୁହନ୍ତୁ', stop: 'ବନ୍ଦ', photo: 'ଫସଲ ଫଟୋ', read: 'ଶୁଣନ୍ତୁ', listening: 'ଶୁଣୁଛି…' } } },
  bn: { translation: { ...en, brandSubtitle: 'বাজার তথ্য', greeting: 'সুপ্রভাত, সঞ্জয়', headline: 'প্রতিটি ফসলের সঠিক মূল্য পান।', heroTitle: 'সঠিক সময়ে সঠিক ক্রেতা খুঁজুন।', createLot: 'ফসলের লট তৈরি', crop: 'ফসল', location: 'স্থান', quantity: 'পরিমাণ (কুইন্টাল)', checkPrices: 'দাম দেখুন', reset: 'ডেমো রিসেট', nav: { dashboard: 'ড্যাশবোর্ড', markets: 'বাজার দাম', lots: 'আমার লট', buyers: 'ক্রেতা মিল', logistics: 'পরিবহন', transactions: 'লেনদেন' }, assistant: { ...en.assistant, title: 'কিসানসেতু পরামর্শদাতা', open: 'কিসানসেতুকে জিজ্ঞাসা করুন', close: 'বন্ধ', hello: 'কীভাবে সাহায্য করব?', listen: 'বলুন', stop: 'থামুন', photo: 'ফসলের ছবি', read: 'শুনুন', listening: 'শুনছি…' } } },
  gu: { translation: { ...en, brandSubtitle: 'બજાર માહિતી', greeting: 'સુપ્રભાત, સંજય', headline: 'દરેક પાકનું પૂરું મૂલ્ય મેળવો.', heroTitle: 'યોગ્ય સમયે યોગ્ય ખરીદદાર શોધો.', createLot: 'પાક લોટ બનાવો', crop: 'પાક', location: 'સ્થળ', quantity: 'જથ્થો (ક્વિન્ટલ)', checkPrices: 'ભાવ જુઓ', reset: 'ડેમો રીસેટ', nav: { dashboard: 'ડેશબોર્ડ', markets: 'બજાર ભાવ', lots: 'મારા લોટ', buyers: 'ખરીદદાર મેળ', logistics: 'પરિવહન', transactions: 'વ્યવહારો' }, assistant: { ...en.assistant, title: 'કિસાનસેતુ સલાહકાર', open: 'કિસાનસેતુને પૂછો', close: 'બંધ', hello: 'હું કેવી રીતે મદદ કરું?', listen: 'બોલો', stop: 'રોકો', photo: 'પાક ફોટો', read: 'સાંભળો', listening: 'સાંભળી રહ્યો છું…' } } },
  te: { translation: { ...en, brandSubtitle: 'మార్కెట్ సమాచారం', greeting: 'శుభోదయం, సంజయ్', headline: 'ప్రతి పంటకు పూర్తి విలువ పొందండి.', heroTitle: 'సరైన సమయంలో సరైన కొనుగోలుదారుని కనుగొనండి.', createLot: 'పంట లాట్ సృష్టించండి', crop: 'పంట', location: 'స్థలం', quantity: 'పరిమాణం (క్వింటాల్)', checkPrices: 'ధరలు చూడండి', reset: 'డెమో రీసెట్', nav: { dashboard: 'డ్యాష్‌బోర్డ్', markets: 'మార్కెట్ ధరలు', lots: 'నా లాట్లు', buyers: 'కొనుగోలుదారులు', logistics: 'రవాణా', transactions: 'లావాదేవీలు' }, assistant: { ...en.assistant, title: 'కిసాన్‌సేతు సలహాదారు', open: 'కిసాన్‌సేతును అడగండి', close: 'మూసివేయి', hello: 'నేను ఎలా సహాయం చేయగలను?', listen: 'మాట్లాడండి', stop: 'ఆపు', photo: 'పంట ఫోటో', read: 'వినండి', listening: 'వింటున్నాను…' } } },
  ta: { translation: { ...en, brandSubtitle: 'சந்தை நுண்ணறிவு', greeting: 'காலை வணக்கம், சஞ்சய்', headline: 'ஒவ்வொரு அறுவடைக்கும் முழு மதிப்பைப் பெறுங்கள்.', heroTitle: 'சரியான நேரத்தில் சரியான வாங்குபவரைக் கண்டறியுங்கள்.', createLot: 'பயிர் தொகுதி உருவாக்கு', crop: 'பயிர்', location: 'இடம்', quantity: 'அளவு (குவிண்டால்)', checkPrices: 'விலை பார்க்க', reset: 'டெமோ மீட்டமை', nav: { dashboard: 'முகப்பு', markets: 'சந்தை விலை', lots: 'என் தொகுதிகள்', buyers: 'வாங்குபவர் பொருத்தம்', logistics: 'போக்குவரத்து', transactions: 'பரிவர்த்தனைகள்' }, assistant: { ...en.assistant, title: 'கிசான்சேது ஆலோசகர்', open: 'கிசான்சேதுவிடம் கேளுங்கள்', close: 'மூடு', hello: 'நான் எப்படி உதவலாம்?', listen: 'பேசுங்கள்', stop: 'நிறுத்து', photo: 'பயிர் படம்', read: 'கேளுங்கள்', listening: 'கேட்கிறேன்…' } } }
};

const cropNames = {
  en: { onion: 'Onion', tomato: 'Tomato', soybean: 'Soybean' },
  hi: { onion: 'प्याज़', tomato: 'टमाटर', soybean: 'सोयाबीन' },
  mr: { onion: 'कांदा', tomato: 'टोमॅटो', soybean: 'सोयाबीन' },
  ur: { onion: 'پیاز', tomato: 'ٹماٹر', soybean: 'سویا بین' },
  tr: { onion: 'Soğan', tomato: 'Domates', soybean: 'Soya fasulyesi' },
  es: { onion: 'Cebolla', tomato: 'Tomate', soybean: 'Soja' },
  pa: { onion: 'ਪਿਆਜ਼', tomato: 'ਟਮਾਟਰ', soybean: 'ਸੋਇਆਬੀਨ' },
  or: { onion: 'ପିଆଜ', tomato: 'ଟମାଟୋ', soybean: 'ସୋୟାବିନ' },
  bn: { onion: 'পেঁয়াজ', tomato: 'টমেটো', soybean: 'সয়াবিন' },
  gu: { onion: 'ડુંગળી', tomato: 'ટામેટું', soybean: 'સોયાબીન' },
  te: { onion: 'ఉల్లిపాయ', tomato: 'టమాటా', soybean: 'సోయాబీన్' },
  ta: { onion: 'வெங்காயம்', tomato: 'தக்காளி', soybean: 'சோயாபீன்' }
};

const playbackUnavailableMessages = {
  en: 'Speech playback is temporarily unavailable. Please try again.',
  hi: 'आवाज़ चलाना अभी उपलब्ध नहीं है। कृपया फिर प्रयास करें।',
  mr: 'आवाज प्लेबॅक सध्या उपलब्ध नाही. कृपया पुन्हा प्रयत्न करा.',
  ur: 'آواز چلانا عارضی طور پر دستیاب نہیں۔ براہ کرم دوبارہ کوشش کریں۔',
  tr: 'Ses oynatma geçici olarak kullanılamıyor. Lütfen tekrar deneyin.',
  es: 'La reproducción de voz no está disponible temporalmente. Inténtalo de nuevo.',
  pa: 'ਆਵਾਜ਼ ਚਲਾਉਣਾ ਇਸ ਵੇਲੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
  or: 'ଶବ୍ଦ ପ୍ଲେବ୍ୟାକ୍ ବର୍ତ୍ତମାନ ଉପଲବ୍ଧ ନାହିଁ। ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।',
  bn: 'ভয়েস প্লেব্যাক সাময়িকভাবে উপলব্ধ নয়। আবার চেষ্টা করুন।',
  gu: 'વૉઇસ પ્લેબૅક હાલમાં ઉપલબ્ધ નથી. કૃપા કરીને ફરી પ્રયાસ કરો.',
  te: 'వాయిస్ ప్లేబ్యాక్ ప్రస్తుతం అందుబాటులో లేదు. దయచేసి మళ్లీ ప్రయత్నించండి.',
  ta: 'குரல் இயக்கம் தற்போது கிடைக்கவில்லை. மீண்டும் முயற்சிக்கவும்.'
};

const voiceInputMessages = {
  en: { voicePermission: 'Microphone permission was denied. Allow microphone access and try again.', voiceAudioCapture: 'No working microphone was found.', voiceNoSpeech: 'No speech was detected. Please try again.', voiceNetwork: 'Voice recognition could not reach its service. Check your connection and try again.', voiceUnavailable: 'Voice recognition is unavailable. Please try again.' },
  hi: { voicePermission: 'माइक्रोफ़ोन की अनुमति नहीं मिली। माइक्रोफ़ोन की अनुमति देकर फिर प्रयास करें।', voiceAudioCapture: 'कोई काम करने वाला माइक्रोफ़ोन नहीं मिला।', voiceNoSpeech: 'कोई आवाज़ नहीं मिली। कृपया फिर प्रयास करें।', voiceNetwork: 'आवाज़ पहचान सेवा से संपर्क नहीं हो सका। इंटरनेट जाँचकर फिर प्रयास करें।', voiceUnavailable: 'आवाज़ पहचान उपलब्ध नहीं है। कृपया फिर प्रयास करें।' },
  mr: { voicePermission: 'मायक्रोफोनची परवानगी नाकारली गेली. परवानगी देऊन पुन्हा प्रयत्न करा.', voiceAudioCapture: 'कार्यरत मायक्रोफोन सापडला नाही.', voiceNoSpeech: 'कोणताही आवाज आढळला नाही. कृपया पुन्हा प्रयत्न करा.', voiceNetwork: 'आवाज ओळख सेवा उपलब्ध झाली नाही. इंटरनेट तपासून पुन्हा प्रयत्न करा.', voiceUnavailable: 'आवाज ओळख उपलब्ध नाही. कृपया पुन्हा प्रयत्न करा.' },
  ur: { voicePermission: 'مائیکروفون کی اجازت نہیں ملی۔ اجازت دے کر دوبارہ کوشش کریں۔', voiceAudioCapture: 'کوئی کام کرنے والا مائیکروفون نہیں ملا۔', voiceNoSpeech: 'کوئی آواز نہیں ملی۔ دوبارہ کوشش کریں۔', voiceNetwork: 'آواز کی شناخت کی خدمت سے رابطہ نہیں ہو سکا۔ انٹرنیٹ چیک کرکے دوبارہ کوشش کریں۔', voiceUnavailable: 'آواز کی شناخت دستیاب نہیں۔ دوبارہ کوشش کریں۔' },
  tr: { voicePermission: 'Mikrofon izni reddedildi. Mikrofon erişimine izin verip tekrar deneyin.', voiceAudioCapture: 'Çalışan bir mikrofon bulunamadı.', voiceNoSpeech: 'Konuşma algılanmadı. Lütfen tekrar deneyin.', voiceNetwork: 'Ses tanıma hizmetine ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.', voiceUnavailable: 'Ses tanıma kullanılamıyor. Lütfen tekrar deneyin.' },
  es: { voicePermission: 'Se denegó el permiso del micrófono. Permite el acceso y vuelve a intentarlo.', voiceAudioCapture: 'No se encontró un micrófono operativo.', voiceNoSpeech: 'No se detectó voz. Inténtalo de nuevo.', voiceNetwork: 'No se pudo conectar con el servicio de reconocimiento de voz. Comprueba tu conexión.', voiceUnavailable: 'El reconocimiento de voz no está disponible. Inténtalo de nuevo.' },
  pa: { voicePermission: 'ਮਾਈਕ੍ਰੋਫੋਨ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਮਿਲੀ। ਪਹੁੰਚ ਦੀ ਇਜਾਜ਼ਤ ਦੇ ਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।', voiceAudioCapture: 'ਕੋਈ ਚੱਲਦਾ ਮਾਈਕ੍ਰੋਫੋਨ ਨਹੀਂ ਮਿਲਿਆ।', voiceNoSpeech: 'ਕੋਈ ਆਵਾਜ਼ ਨਹੀਂ ਮਿਲੀ। ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।', voiceNetwork: 'ਆਵਾਜ਼ ਪਛਾਣ ਸੇਵਾ ਨਾਲ ਸੰਪਰਕ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਇੰਟਰਨੈੱਟ ਜਾਂਚ ਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।', voiceUnavailable: 'ਆਵਾਜ਼ ਪਛਾਣ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।' },
  or: { voicePermission: 'ମାଇକ୍ରୋଫୋନ୍ ଅନୁମତି ମିଳିଲା ନାହିଁ। ଅନୁମତି ଦେଇ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।', voiceAudioCapture: 'କାମ କରୁଥିବା ମାଇକ୍ରୋଫୋନ୍ ମିଳିଲା ନାହିଁ।', voiceNoSpeech: 'କୌଣସି କଥା ଚିହ୍ନଟ ହେଲା ନାହିଁ। ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।', voiceNetwork: 'କଥା ଚିହ୍ନଟ ସେବା ସହ ଯୋଗାଯୋଗ ହୋଇପାରିଲା ନାହିଁ। ଇଣ୍ଟରନେଟ୍ ଯାଞ୍ଚ କରନ୍ତୁ।', voiceUnavailable: 'କଥା ଚିହ୍ନଟ ବର୍ତ୍ତମାନ ଉପଲବ୍ଧ ନାହିଁ। ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।' },
  bn: { voicePermission: 'মাইক্রোফোনের অনুমতি পাওয়া যায়নি। অনুমতি দিয়ে আবার চেষ্টা করুন।', voiceAudioCapture: 'কাজ করে এমন কোনো মাইক্রোফোন পাওয়া যায়নি।', voiceNoSpeech: 'কোনো কথা শনাক্ত হয়নি। আবার চেষ্টা করুন।', voiceNetwork: 'ভয়েস শনাক্তকরণ পরিষেবায় পৌঁছানো যায়নি। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।', voiceUnavailable: 'ভয়েস শনাক্তকরণ উপলভ্য নয়। আবার চেষ্টা করুন।' },
  gu: { voicePermission: 'માઇક્રોફોનની પરવાનગી મળી નથી. પરવાનગી આપીને ફરી પ્રયાસ કરો.', voiceAudioCapture: 'કામ કરતો માઇક્રોફોન મળ્યો નથી.', voiceNoSpeech: 'કોઈ અવાજ ઓળખાયો નથી. ફરી પ્રયાસ કરો.', voiceNetwork: 'વૉઇસ ઓળખ સેવા સાથે જોડાઈ શકાયું નથી. ઇન્ટરનેટ તપાસીને ફરી પ્રયાસ કરો.', voiceUnavailable: 'વૉઇસ ઓળખ ઉપલબ્ધ નથી. ફરી પ્રયાસ કરો.' },
  te: { voicePermission: 'మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. అనుమతించి మళ్లీ ప్రయత్నించండి.', voiceAudioCapture: 'పనిచేసే మైక్రోఫోన్ కనబడలేదు.', voiceNoSpeech: 'మాటలు గుర్తించబడలేదు. మళ్లీ ప్రయత్నించండి.', voiceNetwork: 'వాయిస్ గుర్తింపు సేవను చేరుకోలేకపోయాం. కనెక్షన్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.', voiceUnavailable: 'వాయిస్ గుర్తింపు అందుబాటులో లేదు. మళ్లీ ప్రయత్నించండి.' },
  ta: { voicePermission: 'ஒலிவாங்கி அனுமதி மறுக்கப்பட்டது. அனுமதி அளித்து மீண்டும் முயற்சிக்கவும்.', voiceAudioCapture: 'செயல்படும் ஒலிவாங்கி எதுவும் கிடைக்கவில்லை.', voiceNoSpeech: 'பேச்சு எதுவும் கண்டறியப்படவில்லை. மீண்டும் முயற்சிக்கவும்.', voiceNetwork: 'குரல் அறிதல் சேவையை அணுக முடியவில்லை. இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.', voiceUnavailable: 'குரல் அறிதல் கிடைக்கவில்லை. மீண்டும் முயற்சிக்கவும்.' }
};

const cropImageMessages = {
  en: {
    imageNotCropTitle: 'Not a crop image', imageNotCrop: "This image does not appear to show a crop or plant. Upload a clear photo of the affected crop, leaf, fruit, or stem.", imageUnclear: "I couldn't clearly identify a crop in this image. Try another photo in good lighting with the affected leaf or crop visible.", imagePlant: 'Plant detected', imageHealthy: 'No obvious visual disease symptoms were identified. Continue monitoring the crop if symptoms develop.', imageConditionUnclear: 'Condition unclear', imageHealthUnclear: 'A plant is visible, but its condition cannot be identified reliably. Try a clearer close-up or consult an agriculture expert.', imagePossibleCondition: 'Possible condition: {{condition}}', imageVisibleSigns: 'Visible signs', imageNextStep: 'Recommended next step', imageDisclaimer: 'Image screening is informational only. Confirm crop disease and treatment with a qualified agriculture expert.', imageInvalid: 'Upload a JPG, PNG, or WebP crop image.', imageTooLarge: 'The crop photo must be 6 MB or smaller.', imageAnalysisUnavailable: 'Crop-photo analysis is temporarily unavailable. Please try again later.'
  },
  hi: {
    imageNotCropTitle: 'यह फसल की तस्वीर नहीं है', imageNotCrop: 'यह फसल की तस्वीर नहीं लगती। प्रभावित फसल, पत्ती, फल या तने की साफ तस्वीर अपलोड करें।', imageUnclear: 'मैं इस तस्वीर में फसल को स्पष्ट रूप से पहचान नहीं सका। अच्छी रोशनी में प्रभावित पत्ती या फसल की दूसरी तस्वीर लें।', imagePlant: 'पौधा पहचाना गया', imageHealthy: 'कोई स्पष्ट दृश्य रोग लक्षण नहीं मिले। लक्षण दिखाई दें तो फसल की निगरानी जारी रखें।', imageConditionUnclear: 'स्थिति स्पष्ट नहीं', imageHealthUnclear: 'पौधा दिखाई दे रहा है, लेकिन उसकी स्थिति विश्वसनीय रूप से पहचानी नहीं जा सकी। पास से साफ तस्वीर लें या कृषि विशेषज्ञ से सलाह लें।', imagePossibleCondition: 'संभावित स्थिति: {{condition}}', imageVisibleSigns: 'दिखाई देने वाले संकेत', imageNextStep: 'अगला सुझाया कदम', imageDisclaimer: 'तस्वीर की जाँच केवल जानकारी के लिए है। रोग और उपचार की पुष्टि योग्य कृषि विशेषज्ञ से करें।', imageInvalid: 'JPG, PNG या WebP फसल तस्वीर अपलोड करें।', imageTooLarge: 'फसल की तस्वीर 6 MB या उससे छोटी होनी चाहिए।', imageAnalysisUnavailable: 'फसल तस्वीर विश्लेषण अभी उपलब्ध नहीं है। कृपया बाद में फिर प्रयास करें।'
  },
  mr: {
    imageNotCropTitle: 'हे पिकाचे छायाचित्र नाही', imageNotCrop: 'हे पिकाचे छायाचित्र दिसत नाही. बाधित पीक, पान, फळ किंवा खोडाचे स्पष्ट छायाचित्र अपलोड करा.', imageUnclear: 'या छायाचित्रातील पीक स्पष्टपणे ओळखता आले नाही. चांगल्या प्रकाशात बाधित पान किंवा पिकाचे दुसरे छायाचित्र घ्या.', imagePlant: 'वनस्पती आढळली', imageHealthy: 'दृश्य स्वरूपात रोगाची स्पष्ट लक्षणे आढळली नाहीत. लक्षणे दिसल्यास पिकाचे निरीक्षण सुरू ठेवा.', imageConditionUnclear: 'स्थिती अस्पष्ट', imageHealthUnclear: 'वनस्पती दिसते, पण तिची स्थिती विश्वसनीयपणे ओळखता आली नाही. जवळून स्पष्ट छायाचित्र घ्या किंवा कृषितज्ज्ञांचा सल्ला घ्या.', imagePossibleCondition: 'संभाव्य स्थिती: {{condition}}', imageVisibleSigns: 'दिसणारी चिन्हे', imageNextStep: 'सुचवलेले पुढचे पाऊल', imageDisclaimer: 'छायाचित्र तपासणी केवळ माहितीसाठी आहे. रोग व उपचाराची पुष्टी पात्र कृषितज्ज्ञांकडून करा.', imageInvalid: 'JPG, PNG किंवा WebP पिकाचे छायाचित्र अपलोड करा.', imageTooLarge: 'पिकाचे छायाचित्र 6 MB किंवा त्यापेक्षा लहान असावे.', imageAnalysisUnavailable: 'पिकाच्या छायाचित्राचे विश्लेषण सध्या उपलब्ध नाही. कृपया नंतर पुन्हा प्रयत्न करा.'
  },
  ur: {
    imageNotCropTitle: 'یہ فصل کی تصویر نہیں ہے', imageNotCrop: 'یہ فصل کی تصویر معلوم نہیں ہوتی۔ متاثرہ فصل، پتے، پھل یا تنے کی واضح تصویر اپ لوڈ کریں۔', imageUnclear: 'میں اس تصویر میں فصل کو واضح طور پر شناخت نہیں کر سکا۔ اچھی روشنی میں متاثرہ پتے یا فصل کی دوسری تصویر لیں۔', imagePlant: 'پودا شناخت ہوا', imageHealthy: 'بیماری کی کوئی واضح بصری علامت نہیں ملی۔ علامات ظاہر ہوں تو فصل کی نگرانی جاری رکھیں۔', imageConditionUnclear: 'حالت واضح نہیں', imageHealthUnclear: 'پودا نظر آ رہا ہے، لیکن اس کی حالت قابل اعتماد طور پر شناخت نہیں ہو سکی۔ قریب سے واضح تصویر لیں یا زرعی ماہر سے مشورہ کریں۔', imagePossibleCondition: 'ممکنہ حالت: {{condition}}', imageVisibleSigns: 'نظر آنے والی علامات', imageNextStep: 'تجویز کردہ اگلا قدم', imageDisclaimer: 'تصویری جانچ صرف معلومات کے لیے ہے۔ بیماری اور علاج کی تصدیق مستند زرعی ماہر سے کریں۔', imageInvalid: 'JPG، PNG یا WebP فصل کی تصویر اپ لوڈ کریں۔', imageTooLarge: 'فصل کی تصویر 6 MB یا اس سے کم ہونی چاہیے۔', imageAnalysisUnavailable: 'فصل کی تصویر کا تجزیہ عارضی طور پر دستیاب نہیں۔ بعد میں دوبارہ کوشش کریں۔'
  },
  tr: {
    imageNotCropTitle: 'Bu bir ürün fotoğrafı değil', imageNotCrop: 'Bu görüntü bir ürün veya bitki fotoğrafına benzemiyor. Etkilenen ürünün, yaprağın, meyvenin veya gövdenin net bir fotoğrafını yükleyin.', imageUnclear: 'Bu görüntüde bir ürünü net olarak belirleyemedim. Etkilenen yaprak veya ürün görünürken iyi ışıkta başka bir fotoğraf çekin.', imagePlant: 'Bitki algılandı', imageHealthy: 'Belirgin bir görsel hastalık belirtisi bulunmadı. Belirti gelişirse ürünü izlemeye devam edin.', imageConditionUnclear: 'Durum belirsiz', imageHealthUnclear: 'Bir bitki görünüyor ancak durumu güvenilir biçimde belirlenemiyor. Daha net bir yakın çekim yapın veya bir tarım uzmanına danışın.', imagePossibleCondition: 'Olası durum: {{condition}}', imageVisibleSigns: 'Görünür belirtiler', imageNextStep: 'Önerilen sonraki adım', imageDisclaimer: 'Görüntü taraması yalnızca bilgilendirme amaçlıdır. Hastalığı ve tedaviyi yetkin bir tarım uzmanına doğrulatın.', imageInvalid: 'JPG, PNG veya WebP ürün fotoğrafı yükleyin.', imageTooLarge: 'Ürün fotoğrafı 6 MB veya daha küçük olmalıdır.', imageAnalysisUnavailable: 'Ürün fotoğrafı analizi geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.'
  },
  es: {
    imageNotCropTitle: 'No es una foto de cultivo', imageNotCrop: 'Esta imagen no parece mostrar un cultivo o una planta. Sube una foto clara del cultivo, la hoja, el fruto o el tallo afectado.', imageUnclear: 'No pude identificar claramente un cultivo en esta imagen. Prueba otra foto con buena iluminación y la hoja o el cultivo afectado visible.', imagePlant: 'Planta detectada', imageHealthy: 'No se identificaron síntomas visuales evidentes de enfermedad. Continúa vigilando el cultivo si aparecen síntomas.', imageConditionUnclear: 'Estado no claro', imageHealthUnclear: 'Hay una planta visible, pero no se puede identificar su estado con fiabilidad. Haz una foto de cerca más clara o consulta a un especialista agrícola.', imagePossibleCondition: 'Posible afección: {{condition}}', imageVisibleSigns: 'Signos visibles', imageNextStep: 'Siguiente paso recomendado', imageDisclaimer: 'El análisis de imagen es solo informativo. Confirma la enfermedad y el tratamiento con un especialista agrícola cualificado.', imageInvalid: 'Sube una foto de cultivo JPG, PNG o WebP.', imageTooLarge: 'La foto del cultivo debe pesar 6 MB o menos.', imageAnalysisUnavailable: 'El análisis de fotos de cultivo no está disponible temporalmente. Inténtalo más tarde.'
  },
  pa: {
    imageNotCropTitle: 'ਇਹ ਫਸਲ ਦੀ ਤਸਵੀਰ ਨਹੀਂ ਹੈ', imageNotCrop: 'ਇਹ ਫਸਲ ਜਾਂ ਪੌਦੇ ਦੀ ਤਸਵੀਰ ਨਹੀਂ ਲੱਗਦੀ। ਪ੍ਰਭਾਵਿਤ ਫਸਲ, ਪੱਤੇ, ਫਲ ਜਾਂ ਤਣੇ ਦੀ ਸਾਫ਼ ਤਸਵੀਰ ਅੱਪਲੋਡ ਕਰੋ।', imageUnclear: 'ਮੈਂ ਇਸ ਤਸਵੀਰ ਵਿੱਚ ਫਸਲ ਨੂੰ ਸਪਸ਼ਟ ਤੌਰ ਤੇ ਨਹੀਂ ਪਛਾਣ ਸਕਿਆ। ਚੰਗੀ ਰੌਸ਼ਨੀ ਵਿੱਚ ਪ੍ਰਭਾਵਿਤ ਪੱਤਾ ਜਾਂ ਫਸਲ ਦਿਖਾਉਂਦੀ ਹੋਰ ਤਸਵੀਰ ਲਓ।', imagePlant: 'ਪੌਦਾ ਮਿਲਿਆ', imageHealthy: 'ਬਿਮਾਰੀ ਦੇ ਕੋਈ ਸਪਸ਼ਟ ਦਿੱਖ ਵਾਲੇ ਲੱਛਣ ਨਹੀਂ ਮਿਲੇ। ਲੱਛਣ ਆਉਣ ਤੇ ਫਸਲ ਦੀ ਨਿਗਰਾਨੀ ਜਾਰੀ ਰੱਖੋ।', imageConditionUnclear: 'ਹਾਲਤ ਸਪਸ਼ਟ ਨਹੀਂ', imageHealthUnclear: 'ਪੌਦਾ ਦਿਖਾਈ ਦੇ ਰਿਹਾ ਹੈ ਪਰ ਇਸ ਦੀ ਹਾਲਤ ਭਰੋਸੇਯੋਗ ਢੰਗ ਨਾਲ ਨਹੀਂ ਪਛਾਣੀ ਜਾ ਸਕੀ। ਨੇੜੇ ਤੋਂ ਸਾਫ਼ ਤਸਵੀਰ ਲਓ ਜਾਂ ਖੇਤੀ ਮਾਹਰ ਨਾਲ ਸਲਾਹ ਕਰੋ।', imagePossibleCondition: 'ਸੰਭਾਵਿਤ ਹਾਲਤ: {{condition}}', imageVisibleSigns: 'ਦਿਖਾਈ ਦੇਣ ਵਾਲੇ ਲੱਛਣ', imageNextStep: 'ਸੁਝਾਇਆ ਅਗਲਾ ਕਦਮ', imageDisclaimer: 'ਤਸਵੀਰ ਜਾਂਚ ਸਿਰਫ਼ ਜਾਣਕਾਰੀ ਲਈ ਹੈ। ਬਿਮਾਰੀ ਅਤੇ ਇਲਾਜ ਦੀ ਪੁਸ਼ਟੀ ਯੋਗ ਖੇਤੀ ਮਾਹਰ ਤੋਂ ਕਰੋ।', imageInvalid: 'JPG, PNG ਜਾਂ WebP ਫਸਲ ਦੀ ਤਸਵੀਰ ਅੱਪਲੋਡ ਕਰੋ।', imageTooLarge: 'ਫਸਲ ਦੀ ਤਸਵੀਰ 6 MB ਜਾਂ ਇਸ ਤੋਂ ਛੋਟੀ ਹੋਣੀ ਚਾਹੀਦੀ ਹੈ।', imageAnalysisUnavailable: 'ਫਸਲ ਤਸਵੀਰ ਵਿਸ਼ਲੇਸ਼ਣ ਇਸ ਵੇਲੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਬਾਅਦ ਵਿੱਚ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।'
  },
  or: {
    imageNotCropTitle: 'ଏହା ଫସଲର ଫଟୋ ନୁହେଁ', imageNotCrop: 'ଏହି ଛବିଟି ଫସଲ କିମ୍ବା ଗଛର ଫଟୋ ଭଳି ଲାଗୁନାହିଁ। ପ୍ରଭାବିତ ଫସଲ, ପତ୍ର, ଫଳ କିମ୍ବା ଡାଳର ସ୍ପଷ୍ଟ ଫଟୋ ଅପଲୋଡ୍ କରନ୍ତୁ।', imageUnclear: 'ଏହି ଛବିରେ ଫସଲକୁ ସ୍ପଷ୍ଟ ଭାବେ ଚିହ୍ନଟ କରିପାରିଲି ନାହିଁ। ଭଲ ଆଲୋକରେ ପ୍ରଭାବିତ ପତ୍ର କିମ୍ବା ଫସଲ ଦେଖାଯାଉଥିବା ଆଉ ଏକ ଫଟୋ ନିଅନ୍ତୁ।', imagePlant: 'ଗଛ ଚିହ୍ନଟ ହେଲା', imageHealthy: 'ରୋଗର କୌଣସି ସ୍ପଷ୍ଟ ଦୃଶ୍ୟମାନ ଲକ୍ଷଣ ମିଳିଲା ନାହିଁ। ଲକ୍ଷଣ ଦେଖାଦେଲେ ଫସଲକୁ ନିରୀକ୍ଷଣ କରନ୍ତୁ।', imageConditionUnclear: 'ଅବସ୍ଥା ଅସ୍ପଷ୍ଟ', imageHealthUnclear: 'ଗଛ ଦେଖାଯାଉଛି, କିନ୍ତୁ ଏହାର ଅବସ୍ଥାକୁ ଭରସାଯୋଗ୍ୟ ଭାବେ ଚିହ୍ନଟ କରିହେଲା ନାହିଁ। ନିକଟରୁ ସ୍ପଷ୍ଟ ଫଟୋ ନିଅନ୍ତୁ କିମ୍ବା କୃଷି ବିଶେଷଜ୍ଞଙ୍କ ପରାମର୍ଶ ନିଅନ୍ତୁ।', imagePossibleCondition: 'ସମ୍ଭାବ୍ୟ ଅବସ୍ଥା: {{condition}}', imageVisibleSigns: 'ଦୃଶ୍ୟମାନ ଲକ୍ଷଣ', imageNextStep: 'ପରାମର୍ଶିତ ପରବର୍ତ୍ତୀ ପଦକ୍ଷେପ', imageDisclaimer: 'ଛବି ଯାଞ୍ଚ କେବଳ ସୂଚନା ପାଇଁ। ରୋଗ ଓ ଚିକିତ୍ସାକୁ ଯୋଗ୍ୟ କୃଷି ବିଶେଷଜ୍ଞଙ୍କଠାରୁ ନିଶ୍ଚିତ କରନ୍ତୁ।', imageInvalid: 'JPG, PNG କିମ୍ବା WebP ଫସଲ ଫଟୋ ଅପଲୋଡ୍ କରନ୍ତୁ।', imageTooLarge: 'ଫସଲ ଫଟୋ 6 MB କିମ୍ବା ତାହାଠାରୁ ଛୋଟ ହେବା ଦରକାର।', imageAnalysisUnavailable: 'ଫସଲ ଫଟୋ ବିଶ୍ଳେଷଣ ସାମୟିକ ଭାବେ ଉପଲବ୍ଧ ନାହିଁ। ପରେ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।'
  },
  bn: {
    imageNotCropTitle: 'এটি ফসলের ছবি নয়', imageNotCrop: 'এই ছবিতে ফসল বা গাছ দেখা যাচ্ছে না। আক্রান্ত ফসল, পাতা, ফল বা কাণ্ডের পরিষ্কার ছবি আপলোড করুন।', imageUnclear: 'এই ছবিতে ফসলটি স্পষ্টভাবে শনাক্ত করা যায়নি। ভালো আলোতে আক্রান্ত পাতা বা ফসল দেখা যায় এমন আরেকটি ছবি তুলুন।', imagePlant: 'গাছ শনাক্ত হয়েছে', imageHealthy: 'রোগের কোনো স্পষ্ট দৃশ্যমান লক্ষণ পাওয়া যায়নি। লক্ষণ দেখা দিলে ফসল পর্যবেক্ষণ চালিয়ে যান।', imageConditionUnclear: 'অবস্থা অস্পষ্ট', imageHealthUnclear: 'গাছ দেখা যাচ্ছে, কিন্তু তার অবস্থা নির্ভরযোগ্যভাবে শনাক্ত করা যায়নি। কাছ থেকে পরিষ্কার ছবি তুলুন বা কৃষি বিশেষজ্ঞের পরামর্শ নিন।', imagePossibleCondition: 'সম্ভাব্য অবস্থা: {{condition}}', imageVisibleSigns: 'দৃশ্যমান লক্ষণ', imageNextStep: 'পরামর্শিত পরবর্তী পদক্ষেপ', imageDisclaimer: 'ছবি যাচাই শুধুমাত্র তথ্যের জন্য। রোগ ও চিকিৎসা সম্পর্কে যোগ্য কৃষি বিশেষজ্ঞের নিশ্চিত মত নিন।', imageInvalid: 'JPG, PNG বা WebP ফসলের ছবি আপলোড করুন।', imageTooLarge: 'ফসলের ছবি 6 MB বা তার কম হতে হবে।', imageAnalysisUnavailable: 'ফসলের ছবি বিশ্লেষণ সাময়িকভাবে পাওয়া যাচ্ছে না। পরে আবার চেষ্টা করুন।'
  },
  gu: {
    imageNotCropTitle: 'આ પાકનો ફોટો નથી', imageNotCrop: 'આ છબીમાં પાક અથવા છોડ દેખાતો નથી. અસરગ્રસ્ત પાક, પાન, ફળ અથવા ડાંઠનો સ્પષ્ટ ફોટો અપલોડ કરો.', imageUnclear: 'આ છબીમાં પાક સ્પષ્ટ રીતે ઓળખી શકાયો નથી. સારા પ્રકાશમાં અસરગ્રસ્ત પાન અથવા પાક દેખાય એવો બીજો ફોટો લો.', imagePlant: 'છોડ ઓળખાયો', imageHealthy: 'રોગના કોઈ સ્પષ્ટ દૃશ્યમાન લક્ષણો મળ્યા નથી. લક્ષણો દેખાય તો પાકનું નિરીક્ષણ ચાલુ રાખો.', imageConditionUnclear: 'સ્થિતિ અસ્પષ્ટ', imageHealthUnclear: 'છોડ દેખાય છે, પરંતુ તેની સ્થિતિ વિશ્વસનીય રીતે ઓળખી શકાઈ નથી. નજીકથી સ્પષ્ટ ફોટો લો અથવા કૃષિ નિષ્ણાતની સલાહ લો.', imagePossibleCondition: 'સંભવિત સ્થિતિ: {{condition}}', imageVisibleSigns: 'દેખાતા લક્ષણો', imageNextStep: 'ભલામણ કરેલું આગળનું પગલું', imageDisclaimer: 'છબી તપાસ માત્ર માહિતી માટે છે. રોગ અને સારવારની ખાતરી લાયક કૃષિ નિષ્ણાત પાસેથી કરો.', imageInvalid: 'JPG, PNG અથવા WebP પાકનો ફોટો અપલોડ કરો.', imageTooLarge: 'પાકનો ફોટો 6 MB અથવા તેનાથી નાનો હોવો જોઈએ.', imageAnalysisUnavailable: 'પાકના ફોટાનું વિશ્લેષણ હાલમાં ઉપલબ્ધ નથી. પછી ફરી પ્રયાસ કરો.'
  },
  te: {
    imageNotCropTitle: 'ఇది పంట చిత్రం కాదు', imageNotCrop: 'ఈ చిత్రంలో పంట లేదా మొక్క కనిపించడం లేదు. ప్రభావిత పంట, ఆకు, పండు లేదా కాండం యొక్క స్పష్టమైన చిత్రాన్ని అప్‌లోడ్ చేయండి.', imageUnclear: 'ఈ చిత్రంలో పంటను స్పష్టంగా గుర్తించలేకపోయాను. మంచి వెలుతురులో ప్రభావిత ఆకు లేదా పంట కనిపించేలా మరొక చిత్రం తీయండి.', imagePlant: 'మొక్క గుర్తించబడింది', imageHealthy: 'వ్యాధికి సంబంధించిన స్పష్టమైన దృశ్య లక్షణాలు కనిపించలేదు. లక్షణాలు వస్తే పంటను గమనిస్తూ ఉండండి.', imageConditionUnclear: 'స్థితి అస్పష్టం', imageHealthUnclear: 'మొక్క కనిపిస్తోంది, కానీ దాని స్థితిని నమ్మదగిన విధంగా గుర్తించలేకపోయాం. దగ్గరగా స్పష్టమైన చిత్రం తీయండి లేదా వ్యవసాయ నిపుణుడిని సంప్రదించండి.', imagePossibleCondition: 'సంభావ్య స్థితి: {{condition}}', imageVisibleSigns: 'కనిపించే లక్షణాలు', imageNextStep: 'సిఫార్సు చేసిన తదుపరి చర్య', imageDisclaimer: 'చిత్ర పరిశీలన సమాచారం కోసం మాత్రమే. వ్యాధి మరియు చికిత్సను అర్హత కలిగిన వ్యవసాయ నిపుణుడితో నిర్ధారించండి.', imageInvalid: 'JPG, PNG లేదా WebP పంట చిత్రాన్ని అప్‌లోడ్ చేయండి.', imageTooLarge: 'పంట చిత్రం 6 MB లేదా అంతకంటే చిన్నదిగా ఉండాలి.', imageAnalysisUnavailable: 'పంట చిత్రం విశ్లేషణ ప్రస్తుతం అందుబాటులో లేదు. తర్వాత మళ్లీ ప్రయత్నించండి.'
  },
  ta: {
    imageNotCropTitle: 'இது பயிர் படம் அல்ல', imageNotCrop: 'இந்தப் படத்தில் பயிர் அல்லது செடி இருப்பதாகத் தெரியவில்லை. பாதிக்கப்பட்ட பயிர், இலை, பழம் அல்லது தண்டின் தெளிவான படத்தைப் பதிவேற்றவும்.', imageUnclear: 'இந்தப் படத்தில் பயிரைத் தெளிவாக அடையாளம் காண முடியவில்லை. நல்ல வெளிச்சத்தில் பாதிக்கப்பட்ட இலை அல்லது பயிர் தெரியும் வகையில் மற்றொரு படம் எடுக்கவும்.', imagePlant: 'செடி கண்டறியப்பட்டது', imageHealthy: 'நோயின் தெளிவான காட்சி அறிகுறிகள் எதுவும் கண்டறியப்படவில்லை. அறிகுறிகள் தோன்றினால் பயிரைக் தொடர்ந்து கண்காணிக்கவும்.', imageConditionUnclear: 'நிலை தெளிவில்லை', imageHealthUnclear: 'செடி தெரிகிறது, ஆனால் அதன் நிலையை நம்பகமாக அடையாளம் காண முடியவில்லை. அருகிலிருந்து தெளிவான படம் எடுக்கவும் அல்லது வேளாண் நிபுணரை அணுகவும்.', imagePossibleCondition: 'சாத்தியமான நிலை: {{condition}}', imageVisibleSigns: 'தெரியும் அறிகுறிகள்', imageNextStep: 'பரிந்துரைக்கப்படும் அடுத்த படி', imageDisclaimer: 'பட ஆய்வு தகவலுக்காக மட்டுமே. நோய் மற்றும் சிகிச்சையைத் தகுதியான வேளாண் நிபுணரிடம் உறுதிப்படுத்தவும்.', imageInvalid: 'JPG, PNG அல்லது WebP பயிர் படத்தைப் பதிவேற்றவும்.', imageTooLarge: 'பயிர் படம் 6 MB அல்லது அதற்குக் குறைவாக இருக்க வேண்டும்.', imageAnalysisUnavailable: 'பயிர் படம் பகுப்பாய்வு தற்காலிகமாக கிடைக்கவில்லை. பின்னர் மீண்டும் முயற்சிக்கவும்.'
  }
};

const cropVisionStateMessages = {
  en: { imageProduce: 'Harvested produce', imageHarvested: 'Harvested produce is visible. A disease screening for living plants is not applicable to this photo.', imageUnsupported: 'This crop is visible, but disease screening is not yet supported for it. No condition was identified; consult an agriculture expert if you notice symptoms.' },
  hi: { imageProduce: 'कटी हुई उपज', imageHarvested: 'कटी हुई उपज दिख रही है। इस तस्वीर पर जीवित पौधे की रोग जाँच लागू नहीं होती।', imageUnsupported: 'यह फसल दिख रही है, लेकिन इसके लिए रोग जाँच अभी उपलब्ध नहीं है। कोई रोग तय नहीं किया गया; लक्षण दिखें तो कृषि विशेषज्ञ से सलाह लें।' },
  mr: { imageProduce: 'काढलेले उत्पादन', imageHarvested: 'काढलेले उत्पादन दिसत आहे. या छायाचित्रावर जिवंत पिकाची रोग तपासणी लागू होत नाही.', imageUnsupported: 'हे पीक दिसत आहे, पण त्यासाठी रोग तपासणी अद्याप उपलब्ध नाही. कोणताही रोग निश्चित केलेला नाही; लक्षणे दिसल्यास कृषितज्ज्ञांचा सल्ला घ्या.' },
  ur: { imageProduce: 'کٹائی شدہ پیداوار', imageHarvested: 'کٹائی شدہ پیداوار نظر آ رہی ہے۔ اس تصویر پر زندہ پودے کی بیماری کی جانچ لاگو نہیں ہوتی۔', imageUnsupported: 'یہ فصل نظر آ رہی ہے، لیکن اس کے لیے بیماری کی جانچ ابھی دستیاب نہیں۔ کوئی بیماری شناخت نہیں کی گئی؛ علامات ہوں تو زرعی ماہر سے رجوع کریں۔' },
  tr: { imageProduce: 'Hasat edilmiş ürün', imageHarvested: 'Hasat edilmiş ürün görünüyor. Canlı bitki hastalığı taraması bu fotoğraf için uygun değildir.', imageUnsupported: 'Bu ürün görünüyor ancak hastalık taraması henüz desteklenmiyor. Bir hastalık belirlenmedi; belirtiler varsa bir tarım uzmanına danışın.' },
  es: { imageProduce: 'Producto cosechado', imageHarvested: 'Se ve producto cosechado. El análisis de enfermedades de plantas vivas no corresponde a esta foto.', imageUnsupported: 'Este cultivo es visible, pero aún no se admite su análisis de enfermedades. No se identificó ninguna afección; consulta a un especialista agrícola si observas síntomas.' },
  pa: { imageProduce: 'ਕੱਟੀ ਹੋਈ ਉਪਜ', imageHarvested: 'ਕੱਟੀ ਹੋਈ ਉਪਜ ਦਿਖ ਰਹੀ ਹੈ। ਇਸ ਫੋਟੋ ਲਈ ਜੀਵਤ ਪੌਦੇ ਦੀ ਬਿਮਾਰੀ ਜਾਂਚ ਲਾਗੂ ਨਹੀਂ ਹੁੰਦੀ।', imageUnsupported: 'ਇਹ ਫਸਲ ਦਿਖ ਰਹੀ ਹੈ, ਪਰ ਇਸ ਲਈ ਬਿਮਾਰੀ ਜਾਂਚ ਹਾਲੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਕੋਈ ਬਿਮਾਰੀ ਨਿਰਧਾਰਤ ਨਹੀਂ ਹੋਈ; ਲੱਛਣ ਹੋਣ ਤੇ ਖੇਤੀ ਮਾਹਰ ਨਾਲ ਸਲਾਹ ਕਰੋ।' },
  or: { imageProduce: 'ଅମଳ ହୋଇଥିବା ଫସଲ', imageHarvested: 'ଅମଳ ହୋଇଥିବା ଫସଲ ଦେଖାଯାଉଛି। ଏହି ଫଟୋରେ ଜୀବନ୍ତ ଗଛର ରୋଗ ଯାଞ୍ଚ ପ୍ରଯୁଜ୍ୟ ନୁହେଁ।', imageUnsupported: 'ଏହି ଫସଲ ଦେଖାଯାଉଛି, କିନ୍ତୁ ଏହାର ରୋଗ ଯାଞ୍ଚ ଏପର୍ଯ୍ୟନ୍ତ ଉପଲବ୍ଧ ନୁହେଁ। କୌଣସି ରୋଗ ଚିହ୍ନଟ ହୋଇନାହିଁ; ଲକ୍ଷଣ ଥିଲେ କୃଷି ବିଶେଷଜ୍ଞଙ୍କୁ ପଚାରନ୍ତୁ।' },
  bn: { imageProduce: 'সংগৃহীত ফসল', imageHarvested: 'সংগৃহীত ফসল দেখা যাচ্ছে। এই ছবিতে জীবন্ত গাছের রোগ পরীক্ষা প্রযোজ্য নয়।', imageUnsupported: 'এই ফসল দেখা যাচ্ছে, কিন্তু এর রোগ পরীক্ষা এখনও সমর্থিত নয়। কোনো রোগ শনাক্ত করা হয়নি; লক্ষণ থাকলে কৃষি বিশেষজ্ঞের পরামর্শ নিন।' },
  gu: { imageProduce: 'લણેલી ઉપજ', imageHarvested: 'લણેલી ઉપજ દેખાય છે. આ ફોટા માટે જીવંત છોડના રોગની તપાસ લાગુ પડતી નથી.', imageUnsupported: 'આ પાક દેખાય છે, પણ તેની રોગ તપાસ હજુ ઉપલબ્ધ નથી. કોઈ રોગ ઓળખાયો નથી; લક્ષણો હોય તો કૃષિ નિષ્ણાતને પૂછો.' },
  te: { imageProduce: 'కోత తీసిన పంట', imageHarvested: 'కోత తీసిన పంట కనిపిస్తోంది. ఈ చిత్రానికి జీవించి ఉన్న మొక్క వ్యాధి పరీక్ష వర్తించదు.', imageUnsupported: 'ఈ పంట కనిపిస్తోంది, కానీ దానికి వ్యాధి పరీక్ష ఇంకా అందుబాటులో లేదు. ఏ వ్యాధినీ గుర్తించలేదు; లక్షణాలు ఉంటే వ్యవసాయ నిపుణుడిని సంప్రదించండి.' },
  ta: { imageProduce: 'அறுவடை செய்யப்பட்ட விளைபொருள்', imageHarvested: 'அறுவடை செய்யப்பட்ட விளைபொருள் தெரிகிறது. இந்தப் படத்திற்கு உயிருள்ள செடியின் நோய் ஆய்வு பொருந்தாது.', imageUnsupported: 'இந்தப் பயிர் தெரிகிறது, ஆனால் இதற்கான நோய் ஆய்வு இன்னும் ஆதரிக்கப்படவில்லை. எந்த நோயும் கண்டறியப்படவில்லை; அறிகுறிகள் இருந்தால் வேளாண் நிபுணரை அணுகவும்.' }
};

const harvestedOnionMessages = {
  en: 'This appears to show harvested onions. Upload a clear photo of affected leaves, stems, or bulbs for disease screening.',
  hi: 'यह कटी हुई प्याज की उपज लगती है। रोग जाँच के लिए प्रभावित पत्तियों, तनों या प्याज के कंदों की साफ तस्वीर अपलोड करें।',
  mr: 'हे काढलेले कांदे दिसत आहेत. रोग तपासणीसाठी बाधित पाने, देठ किंवा कांद्याच्या कंदांचे स्पष्ट छायाचित्र अपलोड करा.',
  ur: 'یہ کٹائی شدہ پیاز معلوم ہوتی ہے۔ بیماری کی جانچ کے لیے متاثرہ پتوں، تنوں یا پیاز کے بلبوں کی واضح تصویر اپ لوڈ کریں۔',
  tr: 'Bu görüntü hasat edilmiş soğanları gösteriyor gibi görünüyor. Hastalık taraması için etkilenen yaprakların, gövdelerin veya soğanların net fotoğrafını yükleyin.',
  es: 'Esta imagen parece mostrar cebollas cosechadas. Para analizar enfermedades, sube una foto clara de las hojas, los tallos o los bulbos afectados.',
  pa: 'ਇਸ ਤਸਵੀਰ ਵਿੱਚ ਕੱਟੇ ਹੋਏ ਪਿਆਜ਼ ਦਿਖਦੇ ਹਨ। ਬਿਮਾਰੀ ਦੀ ਜਾਂਚ ਲਈ ਪ੍ਰਭਾਵਿਤ ਪੱਤਿਆਂ, ਤਣਿਆਂ ਜਾਂ ਪਿਆਜ਼ ਦੇ ਗੰਢਾਂ ਦੀ ਸਾਫ਼ ਫੋਟੋ ਅੱਪਲੋਡ ਕਰੋ।',
  or: 'ଏହି ଛବିରେ ଅମଳ ହୋଇଥିବା ପିଆଜ ଦେଖାଯାଉଛି। ରୋଗ ଯାଞ୍ଚ ପାଇଁ ପ୍ରଭାବିତ ପତ୍ର, ଡାଳ କିମ୍ବା ପିଆଜ କନ୍ଦର ସ୍ପଷ୍ଟ ଫଟୋ ଅପଲୋଡ୍ କରନ୍ତୁ।',
  bn: 'এই ছবিতে সংগৃহীত পেঁয়াজ দেখা যাচ্ছে। রোগ পরীক্ষার জন্য আক্রান্ত পাতা, কাণ্ড বা পেঁয়াজের কন্দের পরিষ্কার ছবি আপলোড করুন।',
  gu: 'આ તસવીરમાં લણેલી ડુંગળી દેખાય છે. રોગ તપાસ માટે અસરગ્રસ્ત પાન, ડાંઠ અથવા ડુંગળીના કંદનો સ્પષ્ટ ફોટો અપલોડ કરો.',
  te: 'ఈ చిత్రంలో కోత తీసిన ఉల్లిపాయలు కనిపిస్తున్నాయి. వ్యాధి పరీక్ష కోసం ప్రభావిత ఆకులు, కాండాలు లేదా ఉల్లిపాయ గడ్డల స్పష్టమైన చిత్రాన్ని అప్‌లోడ్ చేయండి.',
  ta: 'இந்தப் படத்தில் அறுவடை செய்யப்பட்ட வெங்காயங்கள் தெரிகின்றன. நோய் ஆய்வுக்காகப் பாதிக்கப்பட்ட இலைகள், தண்டுகள் அல்லது வெங்காயக் கிழங்குகளின் தெளிவான படத்தைப் பதிவேற்றவும்.'
};

for (const [language, message] of Object.entries(playbackUnavailableMessages)) {
  resources[language].translation.assistant.playbackUnavailable = message;
}

for (const [language, page] of Object.entries(pageTranslations)) {
  resources[language].translation.page = page;
  resources[language].translation.crops = cropNames[language];
  Object.assign(resources[language].translation.assistant, voiceInputMessages[language]);
  Object.assign(resources[language].translation.assistant, cropImageMessages[language]);
  Object.assign(resources[language].translation.assistant, cropVisionStateMessages[language]);
  resources[language].translation.assistant.imageHarvestedOnion = harvestedOnionMessages[language];
  resources[language].translation.assistant.disclaimer = page.forecastDisclaimer;
  resources[language].translation.alerts = language === 'en' ? {
    updateTitle: 'KisanSetu update', buyerReadyTitle: 'Buyer offer ready', buyerReadyDetail: 'Review your verified buyer offer and choose to accept, decline, or counter.',
    quantityInvalid: 'Enter a whole quantity from 1 to 5,000 quintals.', dataFallback: 'Market data could not be refreshed. Previously loaded information remains available.',
    lotPublishedTitle: 'Crop lot published', lotPublishedMatch: 'Crop lot published with a matched buyer offer ready.', lotPublished: 'Crop lot published successfully.', lotPublishFailed: 'Could not publish this crop lot.',
    offerAcceptedTitle: 'Offer accepted', offerAcceptedLogistics: 'Offer accepted. {{provider}} is included in the transaction estimate.', offerAcceptedSelect: 'Offer accepted. Select logistics before scheduling pickup.', offerFailed: 'Could not accept this offer.',
    offerDeclinedTitle: 'Offer declined', offerDeclined: 'Offer declined. You can continue comparing verified buyers.', counterTitle: 'Counter-offer sent', counterSent: 'Your counter-offer has been sent to the verified buyer.', offerUpdateFailed: 'Could not update this offer.',
    logisticsRequired: 'Please choose a logistics option before scheduling pickup.', transactionTitle: 'Transaction updated', transactionUpdated: 'Transaction moved to {{status}}.', transactionFailed: 'Could not update transaction status.',
    paymentTitle: 'Payment received', paymentReceived: 'Payment of {{amount}} marked received.', paymentFailed: 'Could not update payment status.', logisticsInvalid: 'Choose a valid logistics option.', logisticsTitle: 'Logistics selected', logisticsUpdated: '{{provider}} selected and the transaction estimate was updated.', logisticsFuture: '{{provider}} selected and will be included after offer acceptance.', logisticsFailed: 'Could not select this logistics option.',
    grievanceRaised: 'Grievance raised successfully. Support will review it.', grievanceFailed: 'Could not raise grievance.', resetTitle: 'Demo reset', resetDone: 'Demo data reset. The pending buyer offer is ready again.', resetFailed: 'Could not reset demo data.', marketsShown: 'Showing all available {{crop}} markets.', marketsFailed: 'Could not load all markets.',
    lotClosedTitle: 'Crop lot closed', lotClosed: 'Crop lot closed and will no longer receive offers.', lotCloseFailed: 'Could not close this crop lot.', lotDeletedTitle: 'Crop lot deleted', lotDeleted: 'Crop lot and pending offers were deleted.', lotDeleteFailed: 'Could not delete this crop lot.', receiptTitle: 'Receipt downloaded', receiptDownloaded: 'Receipt downloaded.'
  } : {
    updateTitle: 'KisanSetu', buyerReadyTitle: page.verifiedBuyerOffer, buyerReadyDetail: `${page.reviewOffers} · ${page.acceptOffer} · ${page.decline} · ${page.counter}`,
    quantityInvalid: page.quantityError, dataFallback: page.marketDataNote, lotPublishedTitle: page.createCropLot, lotPublishedMatch: `${page.createCropLot} · ${page.matchingOffers.replace('{{count}}', '1')}`, lotPublished: page.createCropLot, lotPublishFailed: `${page.createCropLot} · ${page.notSpecified}`,
    offerAcceptedTitle: page.acceptOffer, offerAcceptedLogistics: `${page.acceptOffer} · {{provider}} · ${page.selected}`, offerAcceptedSelect: `${page.acceptOffer} · ${page.select} ${page.logisticsOptions}`, offerFailed: `${page.acceptOffer} · ${page.notSpecified}`,
    offerDeclinedTitle: page.decline, offerDeclined: `${page.decline} · ${page.rankingGuide}`, counterTitle: page.counterSent, counterSent: page.counterSent, offerUpdateFailed: `${page.buyerOffer} · ${page.notSpecified}`,
    logisticsRequired: `${page.select} ${page.logisticsOptions} · ${page.pickup}`, transactionTitle: page.transactions, transactionUpdated: `${page.transactions} · {{status}}`, transactionFailed: `${page.transactions} · ${page.notSpecified}`,
    paymentTitle: page.payment, paymentReceived: `${page.payment} · {{amount}}`, paymentFailed: `${page.payment} · ${page.notSpecified}`, logisticsInvalid: `${page.select} ${page.logisticsOptions}`, logisticsTitle: page.selected, logisticsUpdated: `{{provider}} · ${page.selected}`, logisticsFuture: `{{provider}} · ${page.selected}`, logisticsFailed: `${page.logisticsOptions} · ${page.notSpecified}`,
    grievanceRaised: `${page.raiseGrievance} · ${page.submit}`, grievanceFailed: `${page.raiseGrievance} · ${page.notSpecified}`, resetTitle: resources[language].translation.reset, resetDone: `${resources[language].translation.reset} · ${page.buyerOffer}`, resetFailed: `${resources[language].translation.reset} · ${page.notSpecified}`, marketsShown: page.allMarkets, marketsFailed: `${page.nearbyPrices} · ${page.notSpecified}`,
    lotClosedTitle: page.lotClosed, lotClosed: page.lotClosed, lotCloseFailed: `${page.close} · ${page.notSpecified}`, lotDeletedTitle: page.delete, lotDeleted: `${page.delete} · ${page.lotClosed}`, lotDeleteFailed: `${page.delete} · ${page.notSpecified}`, receiptTitle: page.downloadReceipt, receiptDownloaded: page.downloadReceipt
  };
}

// Fill every remaining farmer-facing string from the language's translated
// workflow vocabulary. This prevents partial locales from silently showing
// English in the hero or assistant while keeping one shared locale choice.
for (const [language, resource] of Object.entries(resources)) {
  if (language === 'en') continue;
  const translation = resource.translation;
  const page = translation.page;
  const topFallbacks = {
    heroEyebrow: page.marketIntelligence,
    heroBody: page.marketDataNote,
    opportunity: page.whyRecommendation,
    checking: `${page.review}…`
  };
  for (const [key, value] of Object.entries(topFallbacks)) {
    if (!translation[key] || translation[key] === en[key]) translation[key] = value;
  }
  const assistant = translation.assistant;
  const assistantFallbacks = {
    subtitle: `${page.priceTrend} · ${page.quality}`,
    intro: `${page.whyRecommendation} · ${page.nearbyPrices} · ${page.logisticsOptions} · ${page.payment}`,
    placeholder: page.describeConcern,
    analyzing: `${page.quality}…`,
    unsupported: page.details,
    disclaimer: page.forecastDisclaimer
  };
  for (const [key, value] of Object.entries(assistantFallbacks)) {
    if (!assistant[key] || assistant[key] === en.assistant[key]) assistant[key] = value;
  }
  assistant.suggestions = [page.sellNow, page.priceTrend, page.nearbyPrices, assistant.photo];
}

const savedLanguage = localStorage.getItem('kisansetu-language');
const initialLanguage = LANGUAGE_OPTIONS.some((item) => item.code === savedLanguage) ? savedLanguage : 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnObjects: true
});

function applyDocumentLanguage(language) {
  document.documentElement.lang = language;
  // Keep the product layout stable. Urdu text is rendered RTL through scoped CSS,
  // without reversing the sidebar, charts, tables, or action order.
  document.documentElement.dir = 'ltr';
  localStorage.setItem('kisansetu-language', language);
}

applyDocumentLanguage(initialLanguage);
i18n.on('languageChanged', applyDocumentLanguage);

export function getSpeechLocale(language = i18n.language) {
  return LANGUAGE_OPTIONS.find((item) => item.code === language)?.locale || 'en-IN';
}

export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pageTranslations from './localization/pageTranslations';

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

for (const [language, page] of Object.entries(pageTranslations)) {
  resources[language].translation.page = page;
  resources[language].translation.crops = cropNames[language];
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

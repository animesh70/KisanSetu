const en = {
  open: 'Smart Route Planner', plannerName: 'Smart Route Planner', eyebrow: 'TRANSACTION ROUTE', title: 'Smart Route Planner',
  calculating: 'Calculating available routes…', calculatingHint: 'Finding the fastest road and available alternatives.',
  pickup: 'Pickup', destination: 'Buyer destination', bestDistance: 'Shortest distance', selectedRoute: 'Selected route',
  estimatedTime: 'Estimated drive time', bestShortest: 'Best · shortest route', alternative: 'Alternative route {{number}}',
  otherRoutes: 'Other available routes', mapAria: 'Available delivery routes map',
  estimatedFallback: 'Live road alternatives were unavailable, so these three route options are estimated.',
  routeUnavailable: 'Route planning is temporarily unavailable.', expand: 'Expand route panel', compact: 'Compact route panel',
  assistantTitle: 'Smart Route Planner', assistantNoTransaction: 'Create or accept a transaction first. Route planning starts after a buyer transaction exists.',
  assistantRoute: 'For {{crop}} to {{buyer}}, the shortest available route is {{distance}} km and about {{minutes}} minutes. {{count}} route option(s) are available.',
  assistantRouteFallback: 'A route estimate is available for {{crop}} to {{buyer}}. Open Smart Route Planner to view it.', assistantOpen: 'Open Smart Route Planner'
};

const translations = {
  en,
  hi: { ...en, eyebrow: 'लेन-देन मार्ग', calculating: 'उपलब्ध मार्गों की गणना हो रही है…', pickup: 'पिकअप', destination: 'खरीदार गंतव्य', bestDistance: 'सबसे कम दूरी', selectedRoute: 'चुना गया मार्ग', estimatedTime: 'अनुमानित यात्रा समय', bestShortest: 'सर्वश्रेष्ठ · सबसे छोटा मार्ग', alternative: 'वैकल्पिक मार्ग {{number}}', routeUnavailable: 'मार्ग योजना अभी उपलब्ध नहीं है।' },
  mr: { ...en, eyebrow: 'व्यवहार मार्ग', calculating: 'उपलब्ध मार्ग मोजत आहोत…', pickup: 'पिकअप', destination: 'खरेदीदार गंतव्य', bestDistance: 'सर्वात कमी अंतर', selectedRoute: 'निवडलेला मार्ग', estimatedTime: 'अंदाजे प्रवास वेळ', bestShortest: 'सर्वोत्तम · सर्वात लहान मार्ग', alternative: 'पर्यायी मार्ग {{number}}' },
  ur: { ...en, eyebrow: 'لین دین کا راستہ', calculating: 'دستیاب راستوں کا حساب ہو رہا ہے…', pickup: 'پک اپ', destination: 'خریدار کی منزل', bestDistance: 'کم ترین فاصلہ', selectedRoute: 'منتخب راستہ', estimatedTime: 'تخمینی سفر کا وقت', bestShortest: 'بہترین · مختصر ترین راستہ', alternative: 'متبادل راستہ {{number}}' },
  tr: { ...en, eyebrow: 'İŞLEM ROTASI', calculating: 'Mevcut rotalar hesaplanıyor…', pickup: 'Alım', destination: 'Alıcı varış noktası', bestDistance: 'En kısa mesafe', selectedRoute: 'Seçilen rota', estimatedTime: 'Tahmini sürüş süresi', bestShortest: 'En iyi · en kısa rota', alternative: 'Alternatif rota {{number}}' },
  es: { ...en, eyebrow: 'RUTA DE LA TRANSACCIÓN', calculating: 'Calculando rutas disponibles…', pickup: 'Recogida', destination: 'Destino del comprador', bestDistance: 'Distancia más corta', selectedRoute: 'Ruta seleccionada', estimatedTime: 'Tiempo estimado', bestShortest: 'Mejor · ruta más corta', alternative: 'Ruta alternativa {{number}}' },
  pa: { ...en, eyebrow: 'ਲੈਣ-ਦੇਣ ਰਸਤਾ', calculating: 'ਉਪਲਬਧ ਰਸਤੇ ਗਿਣੇ ਜਾ ਰਹੇ ਹਨ…', pickup: 'ਪਿਕਅੱਪ', destination: 'ਖਰੀਦਦਾਰ ਮੰਜ਼ਿਲ', bestDistance: 'ਸਭ ਤੋਂ ਘੱਟ ਦੂਰੀ', selectedRoute: 'ਚੁਣਿਆ ਰਸਤਾ', estimatedTime: 'ਅੰਦਾਜ਼ੀ ਯਾਤਰਾ ਸਮਾਂ', bestShortest: 'ਵਧੀਆ · ਸਭ ਤੋਂ ਛੋਟਾ ਰਸਤਾ', alternative: 'ਵਿਕਲਪਿਕ ਰਸਤਾ {{number}}' },
  or: { ...en, eyebrow: 'ଟ୍ରାଞ୍ଜାକ୍ସନ୍ ରୁଟ୍', calculating: 'ଉପଲବ୍ଧ ରୁଟ୍ ଗଣନା ହେଉଛି…', pickup: 'ପିକଅପ୍', destination: 'କ୍ରେତା ଗନ୍ତବ୍ୟ', bestDistance: 'ସବୁଠୁ କମ ଦୂରତା', selectedRoute: 'ବାଛିଥିବା ରୁଟ୍', estimatedTime: 'ଆନୁମାନିକ ଯାତ୍ରା ସମୟ', bestShortest: 'ସର୍ବୋତ୍ତମ · ସବୁଠୁ ଛୋଟ ରୁଟ୍', alternative: 'ବିକଳ୍ପ ରୁଟ୍ {{number}}' },
  bn: { ...en, eyebrow: 'লেনদেন রুট', calculating: 'উপলভ্য রুট হিসাব করা হচ্ছে…', pickup: 'পিকআপ', destination: 'ক্রেতার গন্তব্য', bestDistance: 'সবচেয়ে কম দূরত্ব', selectedRoute: 'নির্বাচিত রুট', estimatedTime: 'আনুমানিক সময়', bestShortest: 'সেরা · সবচেয়ে ছোট রুট', alternative: 'বিকল্প রুট {{number}}' },
  gu: { ...en, eyebrow: 'ટ્રાન્ઝેક્શન માર્ગ', calculating: 'ઉપલબ્ધ માર્ગોની ગણતરી થઈ રહી છે…', pickup: 'પિકઅપ', destination: 'ખરીદદાર ગંતવ્ય', bestDistance: 'સૌથી ઓછું અંતર', selectedRoute: 'પસંદ કરેલ માર્ગ', estimatedTime: 'અંદાજિત મુસાફરી સમય', bestShortest: 'શ્રેષ્ઠ · સૌથી ટૂંકો માર્ગ', alternative: 'વૈકલ્પિક માર્ગ {{number}}' },
  te: { ...en, eyebrow: 'లావాదేవీ మార్గం', calculating: 'అందుబాటులో ఉన్న మార్గాలు లెక్కించబడుతున్నాయి…', pickup: 'పికప్', destination: 'కొనుగోలుదారు గమ్యం', bestDistance: 'అతి తక్కువ దూరం', selectedRoute: 'ఎంచుకున్న మార్గం', estimatedTime: 'అంచనా ప్రయాణ సమయం', bestShortest: 'ఉత్తమ · అతి చిన్న మార్గం', alternative: 'ప్రత్యామ్నాయ మార్గం {{number}}' },
  ta: { ...en, eyebrow: 'பரிவர்த்தனை பாதை', calculating: 'கிடைக்கும் பாதைகள் கணக்கிடப்படுகின்றன…', pickup: 'பிக்கப்', destination: 'வாங்குபவர் இலக்கு', bestDistance: 'குறைந்த தூரம்', selectedRoute: 'தேர்ந்தெடுத்த பாதை', estimatedTime: 'மதிப்பிடப்பட்ட பயண நேரம்', bestShortest: 'சிறந்த · குறுகிய பாதை', alternative: 'மாற்றுப் பாதை {{number}}' }
};

const names = {
  en: 'Smart Route Planner', hi: 'स्मार्ट रूट प्लानर', mr: 'स्मार्ट मार्ग नियोजक', ur: 'اسمارٹ روٹ پلانر', tr: 'Akıllı Rota Planlayıcı', es: 'Planificador inteligente de rutas', pa: 'ਸਮਾਰਟ ਰੂਟ ਯੋਜਕ', or: 'ସ୍ମାର୍ଟ ରୁଟ୍ ପ୍ଲାନର୍', bn: 'স্মার্ট রুট পরিকল্পনাকারী', gu: 'સ્માર્ટ રૂટ પ્લાનર', te: 'స్మార్ట్ రూట్ ప్లానర్', ta: 'ஸ்மார்ட் வழித்தட திட்டமிடல்'
};
for (const [language, name] of Object.entries(names)) {
  Object.assign(translations[language], { open: name, plannerName: name, title: name, assistantTitle: name, assistantOpen: name });
}

export default translations;

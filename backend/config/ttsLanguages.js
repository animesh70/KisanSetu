export const TTS_LANGUAGES = Object.freeze({
  en: Object.freeze({ locale: 'en-IN', voice: 'en-IN-NeerjaNeural' }),
  hi: Object.freeze({ locale: 'hi-IN', voice: 'hi-IN-SwaraNeural' }),
  mr: Object.freeze({ locale: 'mr-IN', voice: 'mr-IN-AarohiNeural' }),
  ur: Object.freeze({ locale: 'ur-IN', voice: 'ur-IN-GulNeural' }),
  tr: Object.freeze({ locale: 'tr-TR', voice: 'tr-TR-EmelNeural' }),
  es: Object.freeze({ locale: 'es-ES', voice: 'es-ES-AbrilNeural' }),
  pa: Object.freeze({ locale: 'pa-IN', voice: 'pa-IN-VaaniNeural' }),
  or: Object.freeze({ locale: 'or-IN', voice: 'or-IN-SubhasiniNeural' }),
  bn: Object.freeze({ locale: 'bn-IN', voice: 'bn-IN-TanishaaNeural' }),
  gu: Object.freeze({ locale: 'gu-IN', voice: 'gu-IN-DhwaniNeural' }),
  te: Object.freeze({ locale: 'te-IN', voice: 'te-IN-ShrutiNeural' }),
  ta: Object.freeze({ locale: 'ta-IN', voice: 'ta-IN-PallaviNeural' })
});

export function getTtsLanguage(language) {
  return typeof language === 'string' ? TTS_LANGUAGES[language] || null : null;
}

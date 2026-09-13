import express, { Router } from 'express';
import { getForecast } from '../services/marketService.js';

const router = Router();
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

const diseaseProfiles = {
  onion: [
    { disease: 'Purple blotch', cause: 'Possible Alternaria fungal stress', remedy: 'Remove heavily affected leaves, improve airflow, and consult a local agriculture officer before applying fungicide.' },
    { disease: 'Downy mildew', cause: 'Possible moisture-related fungal infection', remedy: 'Avoid overhead irrigation, reduce prolonged leaf wetness, and request an expert field inspection.' }
  ],
  tomato: [
    { disease: 'Early blight', cause: 'Possible Alternaria solani infection', remedy: 'Remove affected lower leaves, avoid splashing soil, rotate crops, and confirm treatment with an agriculture expert.' },
    { disease: 'Leaf spot', cause: 'Possible fungal or bacterial leaf stress', remedy: 'Isolate affected plants, keep foliage dry, and obtain a local diagnostic confirmation before spraying.' }
  ],
  soybean: [
    { disease: 'Frogeye leaf spot', cause: 'Possible Cercospora sojina infection', remedy: 'Monitor spread, remove severely affected residue after harvest, and consult local extension guidance.' },
    { disease: 'Nutrient or moisture stress', cause: 'Visual symptoms can resemble disease', remedy: 'Check soil moisture and nutrient history, then confirm with an agronomist or laboratory test.' }
  ],
  default: [
    { disease: 'Leaf stress detected', cause: 'The prototype cannot reliably distinguish disease, pests, or nutrient stress', remedy: 'Capture both sides of the leaf in daylight and obtain confirmation from a qualified crop expert.' },
    { disease: 'Possible fungal leaf spot', cause: 'A visual pattern may be consistent with fungal stress', remedy: 'Keep foliage dry, separate affected material, and confirm locally before applying any treatment.' }
  ]
};

function safeCrop(value) {
  return String(value || 'crop').trim().slice(0, 40);
}

function confidenceFromImage(buffer) {
  const sampleLength = Math.min(buffer.length, 4096);
  let checksum = 0;
  for (let index = 0; index < sampleLength; index += 1) checksum = (checksum + buffer[index] * (index + 1)) % 997;
  return Math.round((68 + (checksum % 18)) * 10) / 10;
}

router.get('/price', async (req, res) => {
  const crop = safeCrop(req.query.crop);
  const requestedDays = Number(req.query.days || 7);
  if (!Number.isInteger(requestedDays) || requestedDays < 1 || requestedDays > 14) {
    return res.status(400).json({ message: 'days must be a whole number between 1 and 14.' });
  }

  const forecast = await getForecast(crop);
  const points = Array.isArray(forecast.forecast) ? forecast.forecast.slice(0, requestedDays) : [];
  const peak = points.reduce((best, point) => (!best || Number(point.predictedPrice) > Number(best.predictedPrice) ? point : best), null);
  const current = Number(forecast.currentPrice || 0);
  const change = peak ? Number(peak.predictedPrice) - current : 0;

  return res.json({
    crop,
    horizonDays: requestedDays,
    currentPrice: current,
    predictedPeak: Number(peak?.predictedPrice || forecast.predictedPeak || current),
    predictedPeakDay: peak?.day || forecast.predictedPeakDay || null,
    expectedChange: change,
    recommendation: change > Number(forecast.validationMAE || 0) ? 'hold' : 'sell',
    confidence: forecast.validationMAE ? 'medium' : 'low',
    forecast: points,
    source: forecast.source,
    analysisMode: 'prototype-price-model',
    disclaimer: 'Model estimate from seeded historical data; not a live mandi quote or guaranteed price.'
  });
});

router.post('/disease', express.raw({ type: ['image/jpeg', 'image/png', 'image/webp', 'application/octet-stream'], limit: MAX_IMAGE_BYTES }), (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length < 100) {
    return res.status(400).json({ message: 'Upload a JPG, PNG, or WebP crop image up to 6 MB.' });
  }

  const crop = safeCrop(req.query.crop);
  const profiles = diseaseProfiles[crop.toLowerCase()] || diseaseProfiles.default;
  const confidence = confidenceFromImage(req.body);
  const profile = profiles[Math.floor(confidence) % profiles.length];

  return res.json({
    crop,
    fileName: String(req.headers['x-file-name'] || 'crop-image').slice(0, 120),
    imageBytes: req.body.length,
    result: profile.disease,
    possibleCause: profile.cause,
    suggestedNextStep: profile.remedy,
    confidence,
    analysisMode: 'mock-image-advisor',
    requiresExpertConfirmation: true,
    disclaimer: 'Prototype screening only. This is not a medical, pesticide, or agronomic diagnosis.'
  });
});

router.use((error, req, res, next) => {
  if (error?.type === 'entity.too.large') return res.status(413).json({ message: 'Image is larger than the 6 MB upload limit.' });
  if (error instanceof SyntaxError) return res.status(400).json({ message: 'The uploaded image could not be read.' });
  return next(error);
});

export default router;

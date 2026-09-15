import express, { Router } from 'express';
import { getForecast } from '../services/marketService.js';
import { analyzeCropImage, CropVisionError, detectSupportedImageMime } from '../services/cropVisionService.js';

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

function safeCrop(value) {
  return String(value || 'crop').trim().slice(0, 40);
}

export function createAdvisorRouter({ analyzeImage = analyzeCropImage } = {}) {
  const router = Router();

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

  router.post('/disease', express.raw({ type: ['image/jpeg', 'image/png', 'image/webp', 'application/octet-stream'], limit: MAX_IMAGE_BYTES }), async (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.length < 100) {
      return res.status(400).json({ message: 'Upload a JPG, PNG, or WebP crop image up to 6 MB.' });
    }

    const mimeType = detectSupportedImageMime(req.body);
    if (!mimeType) {
      return res.status(400).json({ message: 'The uploaded file is not a readable JPG, PNG, or WebP image.' });
    }

    try {
      const analysis = await analyzeImage({
        imageBuffer: req.body,
        mimeType,
        cropHint: safeCrop(req.query.crop)
      });
      return res.json({
        ...analysis,
        fileName: String(req.headers['x-file-name'] || 'crop-image').slice(0, 120),
        imageBytes: req.body.length
      });
    } catch (error) {
      if (error instanceof CropVisionError) {
        const message = error.code === 'VISION_NOT_CONFIGURED'
          ? 'Crop-image analysis is not configured on the server.'
          : error.code === 'VISION_TIMEOUT'
            ? 'Crop-image analysis timed out. Please try another photo.'
            : 'Crop-image analysis is temporarily unavailable. Please try again.';
        return res.status(error.status).json({ error: { code: error.code, message } });
      }
      return res.status(502).json({ error: { code: 'VISION_UNAVAILABLE', message: 'Crop-image analysis is temporarily unavailable. Please try again.' } });
    }
  });

  router.use((error, req, res, next) => {
    if (error?.type === 'entity.too.large') return res.status(413).json({ message: 'Image is larger than the 6 MB upload limit.' });
    if (error instanceof SyntaxError) return res.status(400).json({ message: 'The uploaded image could not be read.' });
    return next(error);
  });

  return router;
}

export default createAdvisorRouter();

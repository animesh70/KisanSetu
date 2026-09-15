function cleanList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()) : [];
}

function detailLines(result, t) {
  const lines = [];
  const observations = cleanList(result?.observations);
  if (observations.length) lines.push(`${t('assistant.imageVisibleSigns')}: ${observations.join('; ')}`);
  if (result?.nextStep) lines.push(`${t('assistant.imageNextStep')}: ${result.nextStep}`);
  return lines;
}

export function cropImageAssistantMessage(result, t) {
  if (result?.imageType === 'not_crop' || result?.isCropImage === false) {
    return {
      intent: 'disease',
      title: t('assistant.imageNotCropTitle'),
      message: t('assistant.imageNotCrop'),
      action: '',
      key: '',
      source: 'disease'
    };
  }

  if (result?.imageType === 'unclear' || result?.isCropImage === null) {
    return {
      intent: 'disease',
      title: `${t('assistant.photo')} · ${t('assistant.imageConditionUnclear')}`,
      message: t('assistant.imageUnclear'),
      action: '',
      key: '',
      source: 'disease'
    };
  }

  const crop = result?.crop || t('assistant.imagePlant');
  const details = detailLines(result, t);
  let summary;

  if (result?.healthStatus === 'healthy') {
    summary = t('assistant.imageHealthy');
  } else if (result?.healthStatus === 'possibly_diseased' && result?.possibleCondition) {
    summary = t('assistant.imagePossibleCondition', { condition: result.possibleCondition });
    if (Number.isFinite(result.conditionConfidence)) summary += ` · ${result.conditionConfidence}%`;
  } else {
    summary = t('assistant.imageHealthUnclear');
  }

  return {
    intent: 'disease',
    title: `${t('assistant.photo')} · ${crop}`,
    message: [summary, ...details, t('assistant.imageDisclaimer')].filter(Boolean).join(' '),
    action: '',
    key: '',
    source: 'disease'
  };
}

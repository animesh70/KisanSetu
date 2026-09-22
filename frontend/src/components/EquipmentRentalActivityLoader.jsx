import { useTranslation } from 'react-i18next';

export default function EquipmentRentalActivityLoader({ className = '', label, title, subtitle } = {}) {
  const { t } = useTranslation();
  const resolvedLabel = label || t('equipment.rentalLoadingLabel');
  const resolvedTitle = title || t('equipment.rentalLoadingTitle');
  const resolvedSubtitle = subtitle || t('equipment.rentalLoadingSubtitle');

  return (
    <div
      className={`equipment-activity-loader ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={resolvedLabel}
    >
      <div className="equipment-github-loader-mascot" aria-hidden="true">
        <img src="/github-feed-loader-mascot.png" alt="" draggable="false" />
      </div>

      <div className="equipment-activity-loader-copy">
        <strong>{resolvedTitle}</strong>
        <p>{resolvedSubtitle}</p>
      </div>
    </div>
  );
}

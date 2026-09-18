import { useTranslation } from 'react-i18next';

export default function EquipmentRentalActivityLoader() {
  const { t } = useTranslation();

  return (
    <div
      className="equipment-activity-loader"
      role="status"
      aria-live="polite"
      aria-label={t('equipment.rentalLoadingLabel')}
    >
      <div className="equipment-github-loader-mascot" aria-hidden="true">
        <img src="/github-feed-loader-mascot.png" alt="" draggable="false" />
      </div>

      <div className="equipment-activity-loader-copy">
        <strong>{t('equipment.rentalLoadingTitle')}</strong>
        <p>{t('equipment.rentalLoadingSubtitle')}</p>
      </div>
    </div>
  );
}

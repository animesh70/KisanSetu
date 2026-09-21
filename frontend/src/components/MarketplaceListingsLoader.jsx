import { useTranslation } from 'react-i18next';

export default function MarketplaceListingsLoader() {
  const { t } = useTranslation();

  return (
    <div
      className="equipment-activity-loader marketplace-listings-loader"
      role="status"
      aria-live="polite"
      aria-label={t('marketplace.loadingLabel')}
    >
      <div className="equipment-github-loader-mascot" aria-hidden="true">
        <img src="/github-feed-loader-mascot.png" alt="" draggable="false" />
      </div>

      <div className="equipment-activity-loader-copy">
        <strong>{t('marketplace.loadingTitle')}</strong>
        <p>{t('marketplace.loading')}</p>
      </div>
    </div>
  );
}

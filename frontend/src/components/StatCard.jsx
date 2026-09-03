export default function StatCard({ label, value, note, accent = 'green' }) {
  return <article className={`stat-card ${accent}`}><p>{label}</p><strong>{value}</strong><span>{note}</span></article>;
}

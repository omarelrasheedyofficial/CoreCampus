export default function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card stat-card">
      {Icon && (
        <span className="stat-icon" aria-hidden="true">
          <Icon size={22} />
        </span>
      )}
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

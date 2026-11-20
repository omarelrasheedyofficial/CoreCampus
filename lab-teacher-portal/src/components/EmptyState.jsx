export default function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={36} strokeWidth={1.5} aria-hidden="true" />}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

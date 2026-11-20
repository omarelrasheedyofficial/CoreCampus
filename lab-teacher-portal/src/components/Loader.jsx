export default function Loader({ label = 'Loading…', fullPage = false }) {
  return (
    <div className={fullPage ? 'center-page' : 'loader'} role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

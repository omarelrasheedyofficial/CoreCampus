export default function PhoneInput({ value = '', onChange }) {
  return (
    <>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          if (/^\+?[0-9]{0,15}$/.test(next)) onChange(next);
        }}
        maxLength={value.startsWith('+') ? 16 : 15}
        pattern="[+]?[0-9]{1,15}"
        title="Up to 15 digits, with an optional + at the start."
        placeholder="+201000000000"
      />
      <small className="muted">Up to 15 digits, with an optional + at the start.</small>
    </>
  );
}

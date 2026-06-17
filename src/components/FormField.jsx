export function FormField({ label, required, error, className = '', children }) {
  return (
    <div
      className={['field', error ? 'hasError' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {label ? (
        <label>
          {label}
          {required ? <span className="requiredMark"> *</span> : null}
        </label>
      ) : null}
      {children}
      <span className={`fieldError ${error ? '' : 'fieldErrorHidden'}`}>
        {error || 'This is required'}
      </span>
    </div>
  )
}

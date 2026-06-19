import './Input.css'

export default function Input({
  label,
  error,
  helperText,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  className = '',
  id,
  ...props
}) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={`td-input-group ${error ? 'td-input-has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="td-input-label">
          {label} {required && <span className="td-input-required">*</span>}
        </label>
      )}
      
      {type === 'textarea' ? (
        <textarea
          id={inputId}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="td-input-field td-input-textarea"
          {...props}
        />
      ) : (
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="td-input-field"
          {...props}
        />
      )}

      {error ? (
        <p className="td-input-error-msg">{error}</p>
      ) : helperText ? (
        <p className="td-input-helper-msg">{helperText}</p>
      ) : null}
    </div>
  )
}

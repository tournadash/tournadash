import './Card.css'

export default function Card({
  children,
  title,
  subtitle,
  footer,
  interactive = false,
  className = '',
  id,
  ...props
}) {
  return (
    <div
      className={`td-card ${interactive ? 'td-card-interactive' : ''} ${className}`}
      id={id}
      {...props}
    >
      {(title || subtitle) && (
        <div className="td-card-header">
          {title && <h3 className="td-card-title">{title}</h3>}
          {subtitle && <p className="td-card-subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="td-card-body">{children}</div>
      {footer && <div className="td-card-footer">{footer}</div>}
    </div>
  )
}

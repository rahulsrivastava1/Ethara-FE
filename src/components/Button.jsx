import { Loader2 } from 'lucide-react'
import './button.css'

export function Spinner({ size = 16, className = '' }) {
  return (
    <Loader2
      className={`spinner ${className}`.trim()}
      size={size}
      aria-hidden="true"
    />
  )
}

export function Button({ loading, children, className = '', disabled, ...props }) {
  return (
    <button
      {...props}
      className={[className, loading ? 'isLoading' : ''].filter(Boolean).join(' ')}
      disabled={disabled || loading}
    >
      <span className="btnContent">
        {loading ? <Spinner size={14} /> : null}
        {children}
      </span>
    </button>
  )
}

export function IconButton({
  loading,
  children,
  className = '',
  disabled,
  ...props
}) {
  return (
    <button
      {...props}
      className={[className, loading ? 'isLoading' : ''].filter(Boolean).join(' ')}
      disabled={disabled || loading}
    >
      {loading ? <Spinner size={14} /> : children}
    </button>
  )
}

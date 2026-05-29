const variants = {
  primary: {
    background: 'linear-gradient(135deg, #f28040 0%, #e05020 100%)',
    color: '#fff',
    border: 'none',
    boxShadow: '0 3px 12px rgba(232,103,42,0.28)',
  },
  secondary: {
    background: '#ffffff',
    color: '#0f0e0c',
    border: '1.5px solid #e5e1d8',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  ghost: {
    background: 'transparent',
    color: '#0f0e0c',
    border: 'none',
    boxShadow: 'none',
  },
  danger: {
    background: 'linear-gradient(135deg, #f06b6b, #d94040)',
    color: '#fff',
    border: 'none',
    boxShadow: '0 3px 10px rgba(217,64,64,0.25)',
  },
  success: {
    background: 'linear-gradient(135deg, #5dba7d, #3a9a5f)',
    color: '#fff',
    border: 'none',
    boxShadow: '0 3px 10px rgba(58,154,95,0.25)',
  },
}

const sizes = {
  sm: { minHeight: 36, padding: '7px 14px', fontSize: 12, borderRadius: 10 },
  md: { minHeight: 42, padding: '10px 20px', fontSize: 14, borderRadius: 12 },
  lg: { minHeight: 48, padding: '13px 28px', fontSize: 15, borderRadius: 14 },
}

const hoverBg = { secondary: '#f5f4f0', ghost: '#f5f4f0' }

const Button = ({ children, variant = 'primary', size = 'md', className = '', disabled, onClick, type = 'button', style = {}, ...props }) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={className}
    aria-busy={props['aria-busy'] || undefined}
    style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transition: 'filter 0.15s ease, transform 0.12s ease, background 0.15s ease',
      fontFamily: '-apple-system, Arial, sans-serif',
      userSelect: 'none',
      WebkitTapHighlightColor: 'transparent',
      ...variants[variant], ...sizes[size], ...style,
    }}
    onMouseEnter={e => {
      if (disabled) return
      if (variant === 'primary' || variant === 'danger' || variant === 'success') {
        e.currentTarget.style.filter = 'brightness(1.08)'
      } else if (hoverBg[variant]) {
        e.currentTarget.style.background = hoverBg[variant]
      }
    }}
    onMouseLeave={e => {
      if (disabled) return
      e.currentTarget.style.filter = ''
      e.currentTarget.style.transform = ''
      if (hoverBg[variant]) e.currentTarget.style.background = variants[variant].background
    }}
    onPointerDown={e => {
      if (disabled) return
      e.currentTarget.style.transform = 'translateY(1px) scale(0.99)'
    }}
    onPointerUp={e => {
      if (disabled) return
      e.currentTarget.style.transform = ''
    }}
    {...props}
  >
    {children}
  </button>
)

export default Button

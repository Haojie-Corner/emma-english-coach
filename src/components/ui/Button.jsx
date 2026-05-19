const variants = {
  primary:   { background: '#d97757', color: '#fff', border: 'none' },
  secondary: { background: 'transparent', color: '#1a1917', border: '1.5px solid #dedad0' },
  ghost:     { background: 'transparent', color: '#1a1917', border: 'none' },
  danger:    { background: '#e05555', color: '#fff', border: 'none' },
}
const sizes = {
  sm: { padding: '6px 14px', fontSize: 12 },
  md: { padding: '9px 20px', fontSize: 13 },
  lg: { padding: '12px 28px', fontSize: 15 },
}

const hoverBg = { primary: '#b85f3e', secondary: '#f5f3ee', ghost: '#f5f3ee', danger: '#c04444' }

const Button = ({ children, variant = 'primary', size = 'md', className = '', disabled, onClick, type = 'button', style = {} }) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={className}
    style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      fontWeight: 600, borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, transition: 'background 0.15s, transform 0.1s',
      fontFamily: '-apple-system, Arial, sans-serif',
      ...variants[variant], ...sizes[size], ...style,
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = hoverBg[variant] }}
    onMouseLeave={e => { if (!disabled) e.currentTarget.style.background = variants[variant].background }}
  >
    {children}
  </button>
)

export default Button

const Card = ({ children, className = '', onClick, style = {} }) => (
  <div
    onClick={onClick}
    className={className}
    style={{
      background: '#ffffff',
      border: '1px solid #dedad0',
      borderRadius: 14,
      padding: '16px 20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      cursor: onClick ? 'pointer' : 'default',
      transition: onClick ? 'box-shadow 0.15s' : 'none',
      ...style,
    }}
    onMouseEnter={e => { if (onClick) e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)' }}
    onMouseLeave={e => { if (onClick) e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}
  >
    {children}
  </div>
)

export default Card

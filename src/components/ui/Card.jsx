const Card = ({ children, className = '', onClick, style = {} }) => (
  <div
    onClick={onClick}
    className={className}
    style={{
      background: '#ffffff',
      border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 18,
      padding: '18px 20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      ...style,
    }}
    onMouseEnter={e => {
      if (onClick) {
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }
    }}
    onMouseLeave={e => {
      if (onClick) {
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)'
        e.currentTarget.style.transform = 'translateY(0)'
      }
    }}
  >
    {children}
  </div>
)

export default Card

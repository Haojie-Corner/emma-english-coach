const Card = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`bg-white border border-[#e8e6dc] rounded-2xl p-5 shadow-[0_1px_3px_rgba(20,20,19,0.06)] ${onClick ? 'cursor-pointer hover:shadow-[0_4px_12px_rgba(20,20,19,0.08)] transition-shadow duration-150' : ''} ${className}`}
  >
    {children}
  </div>
)

export default Card

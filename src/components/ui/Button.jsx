const Button = ({ children, variant = 'primary', size = 'md', className = '', disabled, onClick, type = 'button' }) => {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }
  const variants = {
    primary: 'bg-[#d97757] hover:bg-[#c4633e] text-[#faf9f5]',
    secondary: 'border border-[#e8e6dc] bg-transparent hover:bg-[#f0ede4] text-[#141413]',
    ghost: 'bg-transparent hover:bg-[#f0ede4] text-[#141413]',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  }
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      style={{ fontFamily: 'Poppins, Arial, sans-serif' }}
    >
      {children}
    </button>
  )
}

export default Button

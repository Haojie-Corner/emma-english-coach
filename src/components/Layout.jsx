import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import useProgressStore from '../store/progressStore'

const navItems = [
  { to: '/dashboard', icon: '🏠', label: '首页', labelEn: 'Home' },
  { to: '/course', icon: '📚', label: '课程', labelEn: 'Course' },
  { to: '/practice/speaking', icon: '💬', label: '练习', labelEn: 'Practice' },
  { to: '/vocabulary', icon: '📖', label: '词汇本', labelEn: 'Words' },
  { to: '/profile', icon: '👤', label: '我的', labelEn: 'Me' },
]

const SidebarNav = ({ onLogout }) => (
  <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-[#f0ede4] border-r border-[#e8e6dc] py-6 px-3 fixed left-0 top-0 bottom-0">
    <div className="px-3 mb-8">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🎓</span>
        <div>
          <p className="font-bold text-sm text-[#141413]" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>AI英语陪练</p>
          <p className="text-xs text-[#b0aea5]">AI English Coach</p>
        </div>
      </div>
    </div>

    <nav className="flex-1 space-y-1">
      {navItems.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
              isActive
                ? 'bg-white font-semibold text-[#141413] shadow-sm border-l-[3px] border-[#d97757]'
                : 'text-[#b0aea5] hover:text-[#141413] hover:bg-white/60'
            }`
          }
          style={{ fontFamily: 'Poppins, Arial, sans-serif' }}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>

    <button
      onClick={onLogout}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#b0aea5] hover:text-[#141413] hover:bg-white/60 transition-all duration-150 mt-4"
      style={{ fontFamily: 'Poppins, Arial, sans-serif' }}
    >
      <span>🚪</span>
      <span>退出登录</span>
    </button>
  </aside>
)

const BottomNav = () => (
  <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#faf9f5] border-t border-[#e8e6dc] flex items-center justify-around h-16 px-2 z-50"
    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
    {navItems.map(({ to, icon, label }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) =>
          `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all duration-150 ${
            isActive ? 'text-[#d97757]' : 'text-[#b0aea5]'
          }`
        }
      >
        <span className="text-xl">{icon}</span>
        <span className="text-[10px]" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>{label}</span>
      </NavLink>
    ))}
  </nav>
)

const Layout = () => {
  const { logout } = useUserStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#faf9f5]">
      <SidebarNav onLogout={handleLogout} />
      <main className="lg:ml-60 pb-20 lg:pb-0 min-h-screen">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

export default Layout

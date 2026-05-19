import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import useUserStore from '../store/userStore'

const navItems = [
  { to: '/dashboard',        icon: '🏠', label: '首页'  },
  { to: '/course',           icon: '📚', label: '课程'  },
  { to: '/practice/speaking',icon: '💬', label: '练习'  },
  { to: '/vocabulary',       icon: '📖', label: '词汇本' },
  { to: '/profile',          icon: '👤', label: '我的'  },
]

const SIDEBAR_W = 220

const SidebarNav = ({ onLogout }) => (
  <aside style={{
    width: SIDEBAR_W,
    minHeight: '100vh',
    background: '#ece9e0',
    borderRight: '1px solid #dedad0',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 12px',
    position: 'fixed',
    left: 0, top: 0, bottom: 0,
    zIndex: 100,
  }}>
    {/* Logo */}
    <div style={{ padding: '0 8px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 26 }}>🎓</span>
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#1a1917', lineHeight: 1.2 }}>AI英语陪练</p>
          <p style={{ fontSize: 11, color: '#7a7870', marginTop: 1 }}>AI English Coach</p>
        </div>
      </div>
    </div>

    {/* Nav */}
    <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {navItems.map(({ to, icon, label }) => (
        <NavLink key={to} to={to} style={({ isActive }) => ({
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '9px 12px',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: isActive ? 600 : 400,
          color: isActive ? '#1a1917' : '#7a7870',
          background: isActive ? '#ffffff' : 'transparent',
          boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          borderLeft: isActive ? '3px solid #d97757' : '3px solid transparent',
          textDecoration: 'none',
          transition: 'all 0.15s',
        })}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>

    <button onClick={onLogout} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 10, fontSize: 13,
      color: '#7a7870', background: 'none', border: 'none',
      cursor: 'pointer', width: '100%', transition: 'color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.color = '#1a1917'}
      onMouseLeave={e => e.currentTarget.style.color = '#7a7870'}
    >
      <span>🚪</span><span>退出登录</span>
    </button>
  </aside>
)

const BottomNav = () => (
  <nav style={{
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: '#f5f3ee', borderTop: '1px solid #dedad0',
    display: 'flex', alignItems: 'center', justifyContent: 'space-around',
    height: 60, paddingBottom: 'env(safe-area-inset-bottom)',
    zIndex: 100,
  }}>
    {navItems.map(({ to, icon, label }) => (
      <NavLink key={to} to={to} style={({ isActive }) => ({
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 2, padding: '4px 12px',
        color: isActive ? '#d97757' : '#7a7870',
        textDecoration: 'none', fontSize: 10, fontWeight: 500,
      })}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span>{label}</span>
      </NavLink>
    ))}
  </nav>
)

const BREAKPOINT = 1024

const Layout = () => {
  const { logout } = useUserStore()
  const navigate = useNavigate()
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= BREAKPOINT)

  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= BREAKPOINT)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ee' }}>
      {isDesktop && <SidebarNav onLogout={handleLogout} />}

      <main style={{
        marginLeft: isDesktop ? SIDEBAR_W : 0,
        paddingBottom: isDesktop ? 40 : 80,
        minHeight: '100vh',
      }}>
        <Outlet />
      </main>

      {!isDesktop && <BottomNav />}
    </div>
  )
}

export default Layout

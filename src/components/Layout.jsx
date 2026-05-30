import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import useUserStore from '../store/userStore'
import EmmaBubble from './EmmaBubble'
import Toast from './ui/Toast'
import OfflineBanner from './ui/OfflineBanner'
import { LEARNING_STATE_CHANGED, pushLearningState, syncLearningState } from '../utils/learningStateSync'

const ScrollToTop = () => {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}

/* ── SVG Nav Icons ── */
const HomeIcon = ({ active }) => {
  const c = active ? '#e8672a' : '#9e998e'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 10.5L12 4L20 10.5V20C20 20.55 19.55 21 19 21H15V16H9V21H5C4.45 21 4 20.55 4 20V10.5Z"
        stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        fill={active ? 'rgba(232,103,42,0.12)' : 'none'} />
    </svg>
  )
}

const CourseIcon = ({ active }) => {
  const c = active ? '#e8672a' : '#9e998e'
  const f = active ? 'rgba(232,103,42,0.12)' : 'none'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="7.5" height="7.5" rx="2.2" stroke={c} strokeWidth="1.8" fill={f} />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2.2" stroke={c} strokeWidth="1.8" fill={f} />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2.2" stroke={c} strokeWidth="1.8" fill={f} />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.2" stroke={c} strokeWidth="1.8" fill={f} />
    </svg>
  )
}

const PracticeIcon = ({ active }) => {
  const c = active ? '#e8672a' : '#9e998e'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="9" y="2" width="6" height="12" rx="3" stroke={c} strokeWidth="1.8" fill={active ? 'rgba(232,103,42,0.12)' : 'none'} />
      <path d="M5 11C5 15.4 8.1 18.5 12 18.5C15.9 18.5 19 15.4 19 11" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="18.5" x2="12" y2="21.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="9" y1="21.5" x2="15" y2="21.5" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

const VocabIcon = ({ active }) => {
  const c = active ? '#e8672a' : '#9e998e'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5V19.5Z"
        stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        fill={active ? 'rgba(232,103,42,0.1)' : 'none'} />
      <path d="M4 19.5A2.5 2.5 0 016.5 22H20" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="9" y1="9.5" x2="15" y2="9.5" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="9" y1="13" x2="13" y2="13" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

const ProfileIcon = ({ active }) => {
  const c = active ? '#e8672a' : '#9e998e'
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.8" fill={active ? 'rgba(232,103,42,0.12)' : 'none'} />
      <path d="M4 20C4 16.7 7.6 14 12 14C16.4 14 20 16.7 20 20" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

const navItems = [
  { to: '/dashboard',          Icon: HomeIcon,     label: '首页'   },
  { to: '/course',             Icon: CourseIcon,   label: '课程'   },
  { to: '/practice/speaking',  Icon: PracticeIcon, label: '练习'   },
  { to: '/vocabulary',         Icon: VocabIcon,    label: '词汇本'  },
  { to: '/profile',            Icon: ProfileIcon,  label: '我的'   },
]

const SIDEBAR_W = 220

const SidebarNav = ({ onLogout }) => (
  <aside style={{
    width: SIDEBAR_W, minHeight: '100vh',
    background: '#ffffff',
    borderRight: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '1px 0 0 rgba(0,0,0,0.04)',
    display: 'flex', flexDirection: 'column',
    padding: '20px 12px',
    position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
  }}>
    {/* Logo */}
    <div style={{ padding: '6px 10px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: 'linear-gradient(135deg, #f28040, #e05020)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: '0 3px 10px rgba(232,103,42,0.3)',
        }}>
          <span style={{ fontSize: 18 }}>🎓</span>
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: 13.5, color: '#0f0e0c', lineHeight: 1.2 }}>AI英语陪练</p>
          <p style={{ fontSize: 10.5, color: '#9e998e', marginTop: 1 }}>English Coach</p>
        </div>
      </div>
    </div>

    {/* Nav links */}
    <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {navItems.map(({ to, Icon, label }) => (
        <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
          {({ isActive }) => (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 12,
                background: isActive ? '#fef2ea' : 'transparent',
                transition: 'background 0.14s',
                cursor: 'pointer',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f5f3ef' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: 3, borderRadius: '0 3px 3px 0',
                  background: '#e8672a',
                }} />
              )}
              <Icon active={isActive} />
              <span style={{
                fontSize: 14, fontWeight: isActive ? 700 : 400,
                color: isActive ? '#e8672a' : '#5c5850',
              }}>{label}</span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>

    {/* Emma shortcut */}
    <NavLink to="/teacher" style={{ textDecoration: 'none', display: 'block', marginBottom: 8 }}>
      {({ isActive }) => (
        <div style={{
          borderRadius: 12, padding: '10px 12px',
          background: isActive ? '#fef2ea' : '#fdf7f4',
          border: `1px solid ${isActive ? '#f3c4a2' : '#ede9e1'}`,
          display: 'flex', alignItems: 'center', gap: 10,
          cursor: 'pointer', transition: 'background 0.14s',
        }}
          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#fef2ea' }}
          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = '#fdf7f4' }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #f28040, #e05020)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 13,
            boxShadow: '0 2px 6px rgba(232,103,42,0.3)',
          }}>E</div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#e8672a', lineHeight: 1.2 }}>Emma 老师</p>
            <p style={{ fontSize: 10.5, color: '#9e998e' }}>AI 学习顾问</p>
          </div>
        </div>
      )}
    </NavLink>

    {/* Logout */}
    <button onClick={onLogout} style={{
      display: 'flex', alignItems: 'center', gap: 9,
      padding: '9px 12px', borderRadius: 12,
      fontSize: 13, color: '#9e998e',
      background: 'none', border: 'none',
      cursor: 'pointer', width: '100%',
      transition: 'background 0.14s, color 0.14s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ef'; e.currentTarget.style.color = '#0f0e0c' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9e998e' }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span>退出登录</span>
    </button>
  </aside>
)

const BottomNav = () => (
  <nav style={{
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: 'rgba(255, 255, 255, 0.88)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderTop: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.06)',
    display: 'flex', alignItems: 'stretch',
    height: 64,
    paddingBottom: 'env(safe-area-inset-bottom)',
    zIndex: 100,
  }}>
    {navItems.map(({ to, Icon, label }) => (
      <NavLink key={to} to={to} style={{ flex: 1, textDecoration: 'none' }}>
        {({ isActive }) => (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 3, height: '100%', position: 'relative',
          }}>
            {/* Active pill background */}
            {isActive && (
              <div style={{
                position: 'absolute',
                top: 9,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 44,
                height: 30,
                background: 'rgba(232,103,42,0.1)',
                borderRadius: 15,
              }} />
            )}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <Icon active={isActive} />
            </div>
            <span style={{
              fontSize: 10, fontWeight: isActive ? 700 : 400,
              color: isActive ? '#e8672a' : '#9e998e',
              letterSpacing: '0.01em',
              position: 'relative', zIndex: 1,
            }}>{label}</span>
          </div>
        )}
      </NavLink>
    ))}
  </nav>
)

const BREAKPOINT = 1024

const Layout = () => {
  const { user, logout } = useUserStore()
  const navigate = useNavigate()
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= BREAKPOINT)

  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= BREAKPOINT)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    if (!user?.id) return
    let timer = null
    const pushSoon = () => {
      clearTimeout(timer)
      timer = setTimeout(() => pushLearningState(user.id).catch(() => {}), 900)
    }
    const syncNow = () => syncLearningState(user.id).catch(() => {})
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') syncNow()
      else pushLearningState(user.id).catch(() => {})
    }
    syncNow()
    window.addEventListener(LEARNING_STATE_CHANGED, pushSoon)
    window.addEventListener('focus', syncNow)
    window.addEventListener('online', syncNow)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      clearTimeout(timer)
      window.removeEventListener(LEARNING_STATE_CHANGED, pushSoon)
      window.removeEventListener('focus', syncNow)
      window.removeEventListener('online', syncNow)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [user?.id])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ef' }}>
      {isDesktop && <SidebarNav onLogout={handleLogout} />}
      <main style={{
        marginLeft: isDesktop ? SIDEBAR_W : 0,
        paddingBottom: isDesktop ? 40 : 'calc(104px + env(safe-area-inset-bottom))',
        minHeight: '100vh',
      }}>
        <Outlet />
      </main>
      {!isDesktop && <BottomNav />}
      <ScrollToTop />
      <OfflineBanner />
      <EmmaBubble />
      <Toast />
    </div>
  )
}

export default Layout

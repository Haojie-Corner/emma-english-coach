import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'

const translateError = (msg) => {
  if (!msg) return '操作失败，请重试'
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return '邮箱或密码错误，请重试'
  if (m.includes('email not confirmed')) return '邮箱尚未验证，请查收验证邮件后再登录'
  if (m.includes('user already registered')) return '该邮箱已注册，请直接登录'
  if (m.includes('password should be at least')) return '密码至少需要 6 位字符'
  if (m.includes('unable to validate email')) return '邮箱格式不正确'
  if (m.includes('email rate limit exceeded')) return '发送邮件过于频繁，请稍后再试'
  if (m.includes('network') || m.includes('fetch')) return '网络错误，请检查网络连接后重试'
  return '操作失败：' + msg
}

const Login = () => {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { login, register } = useUserStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        navigate('/dashboard')
      } else {
        await register(email, password, displayName)
        setSuccess('注册成功！请检查邮箱验证链接后登录。')
        setMode('login')
      }
    } catch (err) {
      setError(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  const inputBase = {
    width: '100%', padding: '12px 16px',
    background: '#f5f3ef', border: '1.5px solid #e5e1d8',
    borderRadius: 12, fontSize: 15, color: '#0f0e0c',
    outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s, background 0.15s',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #fff8f4 0%, #f5f3ef 50%, #f0ede6 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 72, height: 72, borderRadius: 22,
            background: 'linear-gradient(135deg, #f28040, #e05020)',
            boxShadow: '0 8px 28px rgba(232,103,42,0.32)',
            marginBottom: 16, fontSize: 36,
          }}>🎓</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.025, color: '#0f0e0c', marginBottom: 6 }}>
            AI 英语陪练大师
          </h1>
          <p style={{ fontSize: 13, color: '#9e998e' }}>AI English Coach · 零基础开口说英语</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 24,
          padding: '32px 28px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05)',
        }}>

          {/* Tab */}
          <div style={{
            display: 'flex', background: '#f5f3ef',
            borderRadius: 12, padding: 4, marginBottom: 28,
          }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }} style={{
                flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 14, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.18s',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#0f0e0c' : '#9e998e',
                boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                fontFamily: 'inherit',
              }}>
                {m === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9e998e', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>昵称</label>
                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="你的名字" required style={inputBase}
                  onFocus={e => { e.target.style.borderColor = '#e8672a'; e.target.style.background = '#fff' }}
                  onBlur={e => { e.target.style.borderColor = '#e5e1d8'; e.target.style.background = '#f5f3ef' }} />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9e998e', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>邮箱</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required style={inputBase}
                onFocus={e => { e.target.style.borderColor = '#e8672a'; e.target.style.background = '#fff' }}
                onBlur={e => { e.target.style.borderColor = '#e5e1d8'; e.target.style.background = '#f5f3ef' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#9e998e', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>密码</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="至少6位" required minLength={6} style={inputBase}
                onFocus={e => { e.target.style.borderColor = '#e8672a'; e.target.style.background = '#fff' }}
                onBlur={e => { e.target.style.borderColor = '#e5e1d8'; e.target.style.background = '#f5f3ef' }} />
            </div>

            {error && (
              <div style={{ background: '#fdf0f0', border: '1px solid #f5b0b0', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#d94040', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ flexShrink: 0 }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div style={{ background: '#edf8f2', border: '1px solid #b5e0c8', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#3a9a5f', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ flexShrink: 0 }}>✅</span>
                <span>{success}</span>
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              background: loading
                ? '#e5e1d8'
                : 'linear-gradient(135deg, #f28040 0%, #e05020 100%)',
              color: loading ? '#9e998e' : '#fff',
              border: 'none', borderRadius: 14,
              padding: '14px 0', fontSize: 16, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4,
              boxShadow: loading ? 'none' : '0 4px 16px rgba(232,103,42,0.3)',
              transition: 'all 0.15s', fontFamily: 'inherit',
              width: '100%',
            }}>
              {loading ? '处理中…' : mode === 'login' ? '登录 →' : '创建账号 →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#9e998e', marginTop: 24 }}>
          从今天开始，用 AI 开口说英语 🚀
        </p>
      </div>
    </div>
  )
}

export default Login

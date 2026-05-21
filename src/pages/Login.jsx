import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'

const inputStyle = {
  width: '100%', padding: '11px 14px',
  background: '#f5f3ee', border: '1.5px solid #dedad0',
  borderRadius: 10, fontSize: 14, color: '#1a1917',
  outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.15s',
}

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

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ee', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
          <h1 className="font-title" style={{ fontSize: 24, color: '#1a1917' }}>AI 英语陪练大师</h1>
          <p style={{ fontSize: 13, color: '#7a7870', marginTop: 4 }}>AI English Coach</p>
        </div>

        {/* 表单卡片 */}
        <div style={{ background: '#fff', border: '1px solid #dedad0', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

          {/* Tab 切换 */}
          <div style={{ display: 'flex', background: '#f5f3ee', borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }} style={{
                flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 14, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#1a1917' : '#7a7870',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                fontFamily: 'inherit',
              }}>
                {m === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#7a7870', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>昵称</label>
                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                  placeholder="你的名字" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#d97757'}
                  onBlur={e => e.target.style.borderColor = '#dedad0'} />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#7a7870', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>邮箱</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#d97757'}
                onBlur={e => e.target.style.borderColor = '#dedad0'} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#7a7870', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>密码</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="至少6位" required minLength={6} style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#d97757'}
                onBlur={e => e.target.style.borderColor = '#dedad0'} />
            </div>

            {error   && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>{error}</div>}
            {success && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#16a34a' }}>{success}</div>}

            <button type="submit" disabled={loading} style={{
              background: loading ? '#e8a98a' : '#d97757', color: '#fff', border: 'none',
              borderRadius: 10, padding: '13px 0', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4,
              transition: 'background 0.15s', fontFamily: 'inherit',
            }}>
              {loading ? '处理中…' : mode === 'login' ? '登录' : '创建账号'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#7a7870', marginTop: 24 }}>
          从今天开始，用 AI 开口说英语 🚀
        </p>
      </div>
    </div>
  )
}

export default Login

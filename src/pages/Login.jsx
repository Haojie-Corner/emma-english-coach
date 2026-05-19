import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUserStore from '../store/userStore'
import Button from '../components/ui/Button'

const Login = () => {
  const [mode, setMode] = useState('login') // login | register
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
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        navigate('/dashboard')
      } else {
        await register(email, password, displayName)
        setSuccess('注册成功！请检查邮箱验证后登录。')
        setMode('login')
      }
    } catch (err) {
      setError(err.message || '操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎓</div>
          <h1 className="text-2xl font-bold text-[#141413]" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
            AI 英语陪练大师
          </h1>
          <p className="text-sm text-[#b0aea5] mt-1">AI English Coach</p>
        </div>

        {/* 表单卡片 */}
        <div className="bg-white border border-[#e8e6dc] rounded-2xl p-8 shadow-[0_4px_12px_rgba(20,20,19,0.08)]">
          {/* Tab 切换 */}
          <div className="flex bg-[#f0ede4] rounded-xl p-1 mb-6">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${mode === m ? 'bg-white text-[#141413] shadow-sm' : 'text-[#b0aea5]'}`}
                style={{ fontFamily: 'Poppins, Arial, sans-serif' }}
              >
                {m === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm text-[#b0aea5] mb-1.5">昵称</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="你的名字"
                  required
                  className="w-full px-4 py-2.5 bg-[#faf9f5] border border-[#e8e6dc] rounded-xl text-sm text-[#141413] outline-none focus:border-[#d97757] transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-[#b0aea5] mb-1.5">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-2.5 bg-[#faf9f5] border border-[#e8e6dc] rounded-xl text-sm text-[#141413] outline-none focus:border-[#d97757] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[#b0aea5] mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="至少6位"
                required
                minLength={6}
                className="w-full px-4 py-2.5 bg-[#faf9f5] border border-[#e8e6dc] rounded-xl text-sm text-[#141413] outline-none focus:border-[#d97757] transition-colors"
              />
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            {success && <p className="text-sm text-[#788c5d] bg-green-50 rounded-lg px-3 py-2">{success}</p>}

            <Button type="submit" disabled={loading} className="w-full mt-2" size="lg">
              {loading ? '处理中…' : mode === 'login' ? '登录' : '创建账号'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[#b0aea5] mt-6">
          从今天开始，用 AI 开口说英语 🚀
        </p>
      </div>
    </div>
  )
}

export default Login

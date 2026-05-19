import useUserStore from '../store/userStore'
import useProgressStore from '../store/progressStore'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useNavigate } from 'react-router-dom'

const Profile = () => {
  const { user, logout } = useUserStore()
  const { streak } = useProgressStore()
  const navigate = useNavigate()

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || '同学'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-[#141413] mb-6" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
        👤 个人中心
      </h1>

      <Card className="mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#d97757] flex items-center justify-center text-white text-xl font-bold" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
          {displayName[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-[#141413]" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>{displayName}</p>
          <p className="text-sm text-[#b0aea5]">{user?.email}</p>
        </div>
      </Card>

      <Card className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="font-bold text-[#141413]">连续打卡 {streak} 天</p>
            <p className="text-xs text-[#b0aea5]">坚持就是胜利！</p>
          </div>
        </div>
      </Card>

      <Button variant="secondary" onClick={handleLogout} className="w-full">
        退出登录
      </Button>
    </div>
  )
}

export default Profile

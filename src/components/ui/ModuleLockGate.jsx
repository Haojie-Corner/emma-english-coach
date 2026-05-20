import { useNavigate } from 'react-router-dom'
import { modules } from '../../data/phonics'
import useProgressStore from '../../store/progressStore'

const ModuleLockGate = ({ moduleId, children }) => {
  const navigate = useNavigate()
  const { isModuleUnlocked, getModuleCompletion } = useProgressStore()

  if (isModuleUnlocked(moduleId)) return children

  const mod = modules.find(m => m.id === moduleId)
  const reqMod = modules.find(m => m.id === mod.requires.moduleId)
  const currentPct = getModuleCompletion(mod.requires.moduleId, reqMod?.totalLessons)
  const requiredPct = mod.requires.pct

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      <button onClick={() => navigate('/course')} style={{
        display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
        color: '#7a7870', background: 'none', border: 'none', cursor: 'pointer',
        marginBottom: 24, padding: 0,
      }}
        onMouseEnter={e => e.currentTarget.style.color = '#1a1917'}
        onMouseLeave={e => e.currentTarget.style.color = '#7a7870'}
      >← 课程中心</button>

      <div style={{
        background: '#fff', border: '1.5px solid #dedad0', borderRadius: 20,
        padding: '40px 32px', textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#f5f3ee', border: '2px solid #dedad0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, margin: '0 auto 20px',
        }}>🔒</div>

        <h2 className="font-title" style={{ fontSize: 20, color: '#1a1917', marginBottom: 8 }}>
          {mod.icon} {mod.name} 已锁定
        </h2>
        <p style={{ fontSize: 14, color: '#7a7870', marginBottom: 28, lineHeight: 1.6 }}>
          解锁前置课程后，这里的内容才能听懂。<br />
          学习顺序帮助你打好基础，循序渐进。
        </p>

        {/* 解锁要求卡片 */}
        <div style={{
          background: '#faf9f5', border: '1px solid #ece9e0',
          borderRadius: 14, padding: '20px 24px', marginBottom: 24, textAlign: 'left',
        }}>
          <p style={{ fontSize: 12, color: '#b0aea5', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            解锁需要
          </p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1917', marginBottom: 16 }}>
            {reqMod?.icon} {reqMod?.name} · {mod.requires.label}
          </p>

          {/* 进度条 */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#7a7870' }}>当前进度</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: currentPct >= requiredPct ? '#788c5d' : '#d97757' }}>
                {currentPct}% / 需达到 {requiredPct}%
              </span>
            </div>
            <div style={{ height: 8, background: '#ece9e0', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                width: `${Math.min(currentPct, 100)}%`,
                background: currentPct >= requiredPct ? '#788c5d' : '#d97757',
                transition: 'width 0.8s ease-out',
              }} />
              {/* 目标线 */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${requiredPct}%`, width: 2,
                background: '#1a1917', opacity: 0.25,
              }} />
            </div>
            <p style={{ fontSize: 11, color: '#b0aea5', marginTop: 6 }}>
              还需完成 {Math.max(0, Math.ceil((requiredPct - currentPct) / 100 * reqMod.totalLessons))} 课即可解锁
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/course/${mod.requires.moduleId}`)}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 12,
            background: 'linear-gradient(135deg, #d97757, #c05e3a)',
            color: '#fff', border: 'none', cursor: 'pointer',
            fontSize: 15, fontWeight: 700, fontFamily: 'Poppins, Arial, sans-serif',
            boxShadow: '0 4px 12px rgba(217,119,87,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(217,119,87,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(217,119,87,0.35)' }}
        >
          去完成 {reqMod?.icon} {reqMod?.name} →
        </button>
      </div>
    </div>
  )
}

export default ModuleLockGate

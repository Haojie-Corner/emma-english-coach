import { useState } from 'react'

export const DIAGNOSTIC_KEY = 'english_diagnostic_profile'

export const DIAGNOSTIC_STEPS = [
  {
    key: 'level',
    title: '你现在最像哪一种？',
    options: [
      { value: 'starter', label: '零基础/很久没学', desc: '先稳住发音和基础句子' },
      { value: 'basic', label: '能读但不敢说', desc: '重点练开口和短句表达' },
      { value: 'speaking', label: '能说但常卡壳', desc: '重点练展开和纠错' },
      { value: 'ielts', label: '备考雅思/高阶', desc: '重点练评分维度和表达质量' },
    ],
  },
  {
    key: 'goal',
    title: '你最想先提升什么？',
    options: [
      { value: 'pronunciation', label: '发音更准', desc: '自然拼读、重音、语调' },
      { value: 'conversation', label: '敢开口聊天', desc: '场景对话和流利表达' },
      { value: 'grammar', label: '少犯语法错', desc: '纠错、改句、复练' },
      { value: 'ielts', label: '雅思口语提分', desc: 'Part 1/2 和 Band 反馈' },
    ],
  },
  {
    key: 'minutes',
    title: '每天比较现实的学习时间？',
    options: [
      { value: 10, label: '10 分钟', desc: '轻量打卡，不断线' },
      { value: 20, label: '20 分钟', desc: '推荐节奏，稳步进步' },
      { value: 40, label: '40 分钟', desc: '冲刺提升，练得更完整' },
    ],
  },
]

export const getStoredDiagnostic = () => {
  try {
    return JSON.parse(localStorage.getItem(DIAGNOSTIC_KEY) || 'null')
  } catch {
    return null
  }
}

const LEVEL_LABELS = { starter: '零基础', basic: '初级', speaking: '中级', ielts: '高阶/雅思' }
const GOAL_LABELS = { pronunciation: '发音更准', conversation: '敢开口聊天', grammar: '少犯语法错', ielts: '雅思口语提分' }

export const getDiagnosticSummary = (profile) => {
  if (!profile) return null
  return [
    profile.level && LEVEL_LABELS[profile.level],
    profile.goal && GOAL_LABELS[profile.goal],
    profile.minutes && `${profile.minutes} 分钟/天`,
  ].filter(Boolean).join(' · ')
}

const DiagnosticModal = ({ initialProfile, onClose, onSave }) => {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(initialProfile || {})
  const current = DIAGNOSTIC_STEPS[step]

  const choose = (key, value) => {
    const next = { ...answers, [key]: value }
    setAnswers(next)
    if (step < DIAGNOSTIC_STEPS.length - 1) {
      setStep(step + 1)
      return
    }
    onSave({ ...next, updatedAt: new Date().toISOString() })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,14,12,0.38)',
      zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 440, background: '#fff', borderRadius: 22,
        border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 20px 70px rgba(0,0,0,0.24)',
        padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#e8672a', marginBottom: 5 }}>英语水平诊断</p>
            <h2 className="font-title" style={{ fontSize: 22, color: '#0f0e0c' }}>{current.title}</h2>
          </div>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 12, border: '1px solid #e5e1d8',
            background: '#fff', color: '#9e998e', cursor: 'pointer', fontSize: 18,
          }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
          {DIAGNOSTIC_STEPS.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 5, borderRadius: 5,
              background: i <= step ? '#e8672a' : '#f0ede6',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {current.options.map(opt => (
            <button key={opt.value} onClick={() => choose(current.key, opt.value)} style={{
              textAlign: 'left', background: answers[current.key] === opt.value ? '#fef2ea' : '#fff',
              border: `1.5px solid ${answers[current.key] === opt.value ? '#f3c4a2' : '#e5e1d8'}`,
              borderRadius: 15, padding: '13px 15px', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: '#0f0e0c', marginBottom: 4 }}>{opt.label}</span>
              <span style={{ display: 'block', fontSize: 12, color: '#5c5850', lineHeight: 1.5 }}>{opt.desc}</span>
            </button>
          ))}
        </div>

        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={{
            marginTop: 14, background: 'none', border: 'none', color: '#9e998e',
            fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>← 上一步</button>
        )}
      </div>
    </div>
  )
}

export default DiagnosticModal

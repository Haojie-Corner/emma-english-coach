import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import useUserStore from '../store/userStore'
import { getVocabulary, getDueVocabulary, addVocabularyWord, updateVocabularyFamiliarity, deleteVocabularyWord } from '../services/supabase'
import { expandVocabulary } from '../services/gemini'
import { speak } from '../utils/tts'

const FAMILIARITY_LABEL = ['陌生', '模糊', '熟悉', '掌握']
const FAMILIARITY_COLOR = ['#c45c5c', '#d97757', '#788c5d', '#5a7a3a']
const FAMILIARITY_BG = ['#fdeaea', '#fdf0ea', '#eaf2e3', '#d8edca']

/* ── 单词卡列表项 ── */
const WordCard = ({ word, onFamiliarityChange, onDelete }) => {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const nextReviewDate = word.next_review ? new Date(word.next_review) : null
  const isDue = nextReviewDate && nextReviewDate <= new Date()

  const handleFamiliarity = async (level) => {
    if (updating) return
    setUpdating(true)
    await onFamiliarityChange(word.word, level)
    setUpdating(false)
  }

  const handleDelete = async () => {
    if (deleting || !window.confirm(`确定删除「${word.word}」？`)) return
    setDeleting(true)
    await onDelete(word.word)
  }

  return (
    <div style={{ background: '#fff', border: `1.5px solid ${isDue ? '#f5c4a8' : '#dedad0'}`, borderRadius: 14, overflow: 'hidden' }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
        {isDue && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97757', flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1a1917' }}>{word.word}</span>
            {word.phonetic && <span style={{ fontSize: 12, color: '#b0aea5', fontFamily: 'monospace' }}>{word.phonetic}</span>}
            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, color: FAMILIARITY_COLOR[word.familiarity] || '#7a7870', background: FAMILIARITY_BG[word.familiarity] || '#f0ede4' }}>
              {FAMILIARITY_LABEL[word.familiarity] || '陌生'}
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#7a7870', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{word.meaning}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={e => { e.stopPropagation(); speak(word.word) }} style={{ fontSize: 16, background: 'none', border: 'none', cursor: 'pointer' }}>🔊</button>
          <span style={{ color: '#b0aea5', transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'none', fontSize: 18 }}>›</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f0ede4' }} className="fade-in">
          {word.example && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 13, color: '#1a1917', fontStyle: 'italic' }}>"{word.example}"</p>
              {word.example_zh && <p style={{ fontSize: 12, color: '#7a7870', marginTop: 2 }}>{word.example_zh}</p>}
            </div>
          )}
          {word.source && (() => {
            const src = word.source
            let icon = '✏️'; let label = src
            if (src === 'manual') { icon = '✏️'; label = '手动添加' }
            else if (src === 'snap') { icon = '📸'; label = '随拍识词' }
            else if (src === '语法练习') { icon = '📝'; label = '语法练习' }
            else if (src.startsWith('场景实战·')) { icon = '🎭'; label = src }
            else if (src.startsWith('自如交流·')) { icon = '💬'; label = src }
            else if (src.startsWith('场景演绎·')) { icon = '🎬'; label = src }
            else if (src.startsWith('语音语调·')) { icon = '🎵'; label = src }
            else if (src.startsWith('自然拼读·') || src === '自然拼读') { icon = '📖'; label = src }
            else if (src.startsWith('Emma')) { icon = '🤖'; label = src }
            return (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 10, color: '#9b7ec8', background: '#f5f0ff',
                border: '1px solid #d0c0e8', borderRadius: 20,
                padding: '2px 8px', marginTop: 8,
              }}>
                {icon} {label}
              </span>
            )
          })()}
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 12, color: '#7a7870', marginBottom: 8 }}>掌握程度</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {FAMILIARITY_LABEL.map((label, level) => (
                <button key={level} onClick={() => handleFamiliarity(level)} disabled={updating} style={{
                  flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                  border: `1.5px solid ${word.familiarity === level ? FAMILIARITY_COLOR[level] : '#dedad0'}`,
                  background: word.familiarity === level ? FAMILIARITY_BG[level] : '#faf9f5',
                  color: word.familiarity === level ? FAMILIARITY_COLOR[level] : '#7a7870',
                  cursor: 'pointer',
                }}>{label}</button>
              ))}
            </div>
          </div>
          {nextReviewDate && (
            <p style={{ fontSize: 11, color: '#b0aea5', marginTop: 8 }}>
              下次复习：{isDue ? '今天' : nextReviewDate.toLocaleDateString('zh-CN')}
            </p>
          )}
          <button onClick={handleDelete} style={{ marginTop: 12, fontSize: 12, color: '#c45c5c', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {deleting ? '删除中…' : '🗑 删除'}
          </button>
        </div>
      )}
    </div>
  )
}

/* ── 闪卡复习模式 ── */
const FlashCardReview = ({ words, onFinish, onUpdateFamiliarity }) => {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState([]) // { word, level }
  const [updating, setUpdating] = useState(false)

  const current = words[index]
  const total = words.length
  const progress = Math.round((index / total) * 100)

  const handleRate = async (level) => {
    if (updating) return
    setUpdating(true)
    await onUpdateFamiliarity(current.word, level)
    setUpdating(false)
    setDone(prev => [...prev, { word: current.word, level }])
    if (index + 1 >= total) {
      setIndex(total)
    } else {
      setIndex(index + 1)
      setFlipped(false)
    }
  }

  // 完成页
  if (index >= total) {
    const counts = [0, 0, 0, 0]
    done.forEach(d => counts[d.level]++)
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '24px 16px', textAlign: 'center' }} className="fade-in">
        <p style={{ fontSize: 48, marginBottom: 12 }}>🎉</p>
        <h2 className="font-title" style={{ fontSize: 20, color: '#1a1917', marginBottom: 6 }}>复习完成！</h2>
        <p style={{ fontSize: 13, color: '#7a7870', marginBottom: 24 }}>共复习了 {total} 个单词</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {FAMILIARITY_LABEL.map((label, level) => counts[level] > 0 && (
            <div key={level} style={{ background: FAMILIARITY_BG[level], borderRadius: 12, padding: '12px 16px' }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: FAMILIARITY_COLOR[level] }}>{counts[level]}</p>
              <p style={{ fontSize: 12, color: FAMILIARITY_COLOR[level] }}>{label}</p>
            </div>
          ))}
        </div>
        <Button onClick={onFinish} style={{ width: '100%', justifyContent: 'center' }}>返回词汇本</Button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: '24px 16px' }}>
      {/* 进度条 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onFinish} style={{ fontSize: 13, color: '#7a7870', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← 退出</button>
        <div style={{ flex: 1, height: 6, background: '#ece9e0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#d97757', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontSize: 12, color: '#7a7870', flexShrink: 0 }}>{index}/{total}</span>
      </div>

      {/* 闪卡 */}
      <div
        onClick={() => !flipped && setFlipped(true)}
        style={{
          background: '#fff', border: '1.5px solid #dedad0', borderRadius: 20,
          padding: '40px 28px', textAlign: 'center', cursor: flipped ? 'default' : 'pointer',
          minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.07)', transition: 'box-shadow 0.2s',
          marginBottom: 20,
        }}
      >
        <p style={{ fontSize: 36, fontWeight: 800, color: '#1a1917', marginBottom: 8 }}>{current.word}</p>
        {current.phonetic && <p style={{ fontSize: 14, color: '#b0aea5', fontFamily: 'monospace', marginBottom: 12 }}>{current.phonetic}</p>}
        <button onClick={e => { e.stopPropagation(); speak(current.word) }} style={{ fontSize: 12, color: '#d97757', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 16 }}>🔊 听发音</button>

        {!flipped ? (
          <div style={{ marginTop: 8 }}>
            <div style={{ width: 40, height: 2, background: '#ece9e0', margin: '0 auto 8px' }} />
            <p style={{ fontSize: 12, color: '#b0aea5' }}>点击翻转查看释义</p>
          </div>
        ) : (
          <div className="fade-in" style={{ marginTop: 8, width: '100%' }}>
            <div style={{ width: 40, height: 2, background: '#d97757', margin: '0 auto 16px' }} />
            <p style={{ fontSize: 18, fontWeight: 600, color: '#1a1917', marginBottom: 8 }}>{current.meaning}</p>
            {current.example && (
              <div style={{ background: '#faf9f5', borderRadius: 10, padding: '10px 14px', textAlign: 'left', marginTop: 10 }}>
                <p style={{ fontSize: 13, color: '#1a1917', fontStyle: 'italic' }}>"{current.example}"</p>
                {current.example_zh && <p style={{ fontSize: 12, color: '#7a7870', marginTop: 4 }}>{current.example_zh}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 评级按钮（翻转后显示） */}
      {flipped && (
        <div className="fade-in">
          <p style={{ fontSize: 12, color: '#7a7870', textAlign: 'center', marginBottom: 10 }}>这个单词你掌握得怎么样？</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {FAMILIARITY_LABEL.map((label, level) => (
              <button key={level} onClick={() => handleRate(level)} disabled={updating} style={{
                padding: '12px 8px', borderRadius: 12, fontSize: 13, fontWeight: 600,
                border: `1.5px solid ${FAMILIARITY_COLOR[level]}`,
                background: FAMILIARITY_BG[level], color: FAMILIARITY_COLOR[level],
                cursor: 'pointer', transition: 'opacity 0.15s',
              }}>
                {label}
                <span style={{ fontSize: 10, display: 'block', fontWeight: 400, marginTop: 2, opacity: 0.8 }}>
                  {['下次还来', '再复习一次', '3天后复习', '2周后复习'][level]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── 添加单词弹窗 ── */
const AddWordModal = ({ onClose, onAdd, userId }) => {
  const [form, setForm] = useState({ word: '', phonetic: '', meaning: '', example: '', example_zh: '' })
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAiFill = async () => {
    if (!form.word.trim()) { setError('请先输入单词'); return }
    setAiLoading(true); setError('')
    try {
      const data = await expandVocabulary(form.word.trim())
      setForm(prev => ({
        ...prev,
        phonetic: data.phonetic || prev.phonetic,
        meaning: data.meaning || prev.meaning,
        example: data.example || prev.example,
        example_zh: data.example_zh || prev.example_zh,
      }))
    } catch (e) {
      setError('AI 填写失败，请手动输入')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.word.trim() || !form.meaning.trim()) { setError('单词和释义不能为空'); return }
    setLoading(true); setError('')
    try {
      await addVocabularyWord(userId, form.word.trim(), form.phonetic.trim(), form.meaning.trim(), form.example.trim(), form.example_zh.trim(), 'manual')
      onAdd()
      onClose()
    } catch (e) {
      setError('添加失败：' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', padding: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 640, margin: '0 auto', padding: '24px 20px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: '#1a1917' }}>添加单词</h3>
          <button onClick={onClose} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#b0aea5' }}>×</button>
        </div>

        {/* 单词输入 + AI填充 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, color: '#7a7870', marginBottom: 4, display: 'block' }}>单词 *</label>
            <input
              value={form.word}
              onChange={e => setForm({ ...form, word: e.target.value })}
              placeholder="e.g. persevere"
              style={{ width: '100%', background: '#faf9f5', border: '1.5px solid #dedad0', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#1a1917', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#d97757'}
              onBlur={e => e.target.style.borderColor = '#dedad0'}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <button onClick={handleAiFill} disabled={aiLoading} style={{
              background: aiLoading ? '#e8a98a' : '#fdf0ea', color: '#d97757',
              border: '1.5px solid #f5c4a8', borderRadius: 10, padding: '10px 14px',
              fontSize: 13, fontWeight: 600, cursor: aiLoading ? 'default' : 'pointer', whiteSpace: 'nowrap',
            }}>
              {aiLoading ? '⏳ 填写中…' : '✨ AI 填写'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { key: 'meaning', label: '中文释义 *', placeholder: 'e.g. 坚持不懈，锲而不舍' },
            { key: 'example', label: '例句（英文）', placeholder: 'e.g. You must persevere if you want to succeed.' },
            { key: 'example_zh', label: '例句翻译', placeholder: 'e.g. 如果你想成功，就必须坚持不懈。' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 12, color: '#7a7870', marginBottom: 4, display: 'block' }}>{label}</label>
              <input
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                style={{ width: '100%', background: '#faf9f5', border: '1.5px solid #dedad0', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#1a1917', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#d97757'}
                onBlur={e => e.target.style.borderColor = '#dedad0'}
              />
            </div>
          ))}
          {error && <p style={{ fontSize: 13, color: '#c45c5c' }}>{error}</p>}
          <Button onClick={handleSubmit} disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            {loading ? '添加中…' : '添加到词汇本'}
          </Button>
        </div>
      </div>
    </div>
  )
}

/* ── 主页面 ── */
const Vocabulary = () => {
  const { user } = useUserStore()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') === 'due' ? 'due' : 'all')
  const [words, setWords] = useState([])
  const [dueWords, setDueWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [reviewMode, setReviewMode] = useState(false)
  const [search, setSearch] = useState('')

  const loadWords = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [all, due] = await Promise.all([getVocabulary(user.id), getDueVocabulary(user.id)])
      setWords(all)
      setDueWords(due)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { loadWords() }, [loadWords])

  const handleFamiliarityChange = async (word, level) => {
    await updateVocabularyFamiliarity(user.id, word, level)
    await loadWords()
  }

  const handleDelete = async (word) => {
    await deleteVocabularyWord(user.id, word)
    await loadWords()
  }

  const filtered = words.filter(w =>
    !search || w.word.toLowerCase().includes(search.toLowerCase()) || w.meaning.includes(search)
  )
  const displayWords = tab === 'due' ? dueWords : filtered

  // 闪卡复习模式全屏覆盖
  if (reviewMode) {
    return (
      <FlashCardReview
        words={dueWords}
        onFinish={() => { setReviewMode(false); loadWords() }}
        onUpdateFamiliarity={handleFamiliarityChange}
      />
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h1 className="font-title" style={{ fontSize: 22, color: '#1a1917' }}>📖 词汇本</h1>
          <p style={{ fontSize: 12, color: '#b0aea5', marginTop: 2 }}>基于遗忘曲线安排复习，学过的单词不再忘</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          background: '#d97757', color: '#fff', border: 'none', borderRadius: 10,
          padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>+ 添加</button>
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', background: '#f0ede4', borderRadius: 12, padding: 4, margin: '16px 0' }}>
        <button onClick={() => setTab('all')} style={{
          flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 13, fontWeight: 600,
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          background: tab === 'all' ? '#fff' : 'transparent',
          color: tab === 'all' ? '#141413' : '#b0aea5',
          boxShadow: tab === 'all' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
        }}>全部 ({words.length})</button>
        <button onClick={() => setTab('due')} style={{
          flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 13, fontWeight: 600,
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          background: tab === 'due' ? '#fff' : 'transparent',
          color: tab === 'due' ? (dueWords.length > 0 ? '#d97757' : '#141413') : '#b0aea5',
          boxShadow: tab === 'due' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
        }}>
          今日复习 {dueWords.length > 0 && <span style={{ background: '#d97757', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10 }}>{dueWords.length}</span>}
        </button>
      </div>

      {/* 遗忘曲线规则说明（今日复习 tab 顶部） */}
      {tab === 'due' && (
        <div style={{ background: '#f5f3ee', border: '1px solid #e8e4d8', borderRadius: 12, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>📅</span>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#1a1917', marginBottom: 4 }}>遗忘曲线复习规则</p>
            <p style={{ fontSize: 12, color: '#7a7870', lineHeight: 1.6 }}>
              复习后按掌握程度评级，自动安排下次：
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              {[['陌生', '#c45c5c', '+1天'], ['模糊', '#d97757', '+3天'], ['熟悉', '#788c5d', '+7天'], ['掌握', '#5a7a3a', '+14天']].map(([label, color, day]) => (
                <span key={label} style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: `${color}18`, color, border: `1px solid ${color}40` }}>
                  {label} {day}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 搜索 */}
      {tab === 'all' && words.length > 0 && (
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索单词或含义…"
          style={{ width: '100%', background: '#faf9f5', border: '1.5px solid #dedad0', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#1a1917', outline: 'none', marginBottom: 16, boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = '#d97757'}
          onBlur={e => e.target.style.borderColor = '#dedad0'}
        />
      )}

      {/* 熟练度统计 */}
      {tab === 'all' && words.length > 0 && !search && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {FAMILIARITY_LABEL.map((label, level) => {
            const count = words.filter(w => w.familiarity === level).length
            if (count === 0) return null
            return (
              <div key={level} style={{ flex: 1, textAlign: 'center', background: FAMILIARITY_BG[level], borderRadius: 10, padding: '8px 4px' }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: FAMILIARITY_COLOR[level] }}>{count}</p>
                <p style={{ fontSize: 10, color: FAMILIARITY_COLOR[level] }}>{label}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* 今日复习入口 */}
      {tab === 'due' && dueWords.length > 0 && (
        <div style={{ background: '#fdf0ea', border: '1px solid #f5c4a8', borderRadius: 14, padding: '16px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#d97757', marginBottom: 2 }}>
              📅 今天有 {dueWords.length} 个单词需要复习
            </p>
            <p style={{ fontSize: 12, color: '#7a7870' }}>翻卡模式 · 一个一个过 · 5分钟搞定</p>
          </div>
          <button onClick={() => setReviewMode(true)} style={{
            background: '#d97757', color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          }}>开始复习 →</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p className="spin" style={{ display: 'inline-block', fontSize: 24 }}>⏳</p>
        </div>
      ) : displayWords.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>
            {tab === 'due' ? '🎉' : search ? '🔍' : '📚'}
          </p>
          <p style={{ fontWeight: 600, color: '#1a1917', marginBottom: 6 }}>
            {tab === 'due' ? '今天没有需要复习的单词' : search ? '没有匹配的单词' : '词汇本还是空的'}
          </p>
          <p style={{ fontSize: 13, color: '#b0aea5' }}>
            {tab === 'due' ? '太棒了！所有单词都复习完了 🙌' : search ? '换个关键词试试' : '上场景实战或自如交流课时，点击词汇旁的 + 可一键存入；也可点击右上角"+ 添加"手动录入'}
          </p>
          {tab === 'all' && !search && (
            <Button onClick={() => setShowAdd(true)} style={{ marginTop: 16 }}>手动添加单词</Button>
          )}
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayWords.map(word => (
            <WordCard key={word.word} word={word} onFamiliarityChange={handleFamiliarityChange} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showAdd && (
        <AddWordModal userId={user?.id} onClose={() => setShowAdd(false)} onAdd={loadWords} />
      )}
    </div>
  )
}

export default Vocabulary

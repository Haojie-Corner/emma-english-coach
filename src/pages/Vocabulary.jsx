import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import useUserStore from '../store/userStore'
import { getVocabulary, getDueVocabulary, addVocabularyWord, updateVocabularyFamiliarity, deleteVocabularyWord } from '../services/supabase'
import { expandVocabulary } from '../services/gemini'
import { rateSentence } from '../services/deepseek'
import { speak } from '../utils/tts'

const FAMILIARITY_LABEL = ['陌生', '模糊', '熟悉', '掌握']
const FAMILIARITY_COLOR = ['#d94040', '#e8672a', '#5a8c4a', '#3a9a5f']
const FAMILIARITY_BG = ['#fdf0f0', '#fff3ee', '#eaf5ef', '#d8f0e8']

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
    <div style={{
      background: '#fff',
      border: `1.5px solid ${isDue ? '#f5c4a8' : 'rgba(0,0,0,0.07)'}`,
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: isDue ? '0 2px 10px rgba(232,103,42,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div onClick={() => setExpanded(!expanded)} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
        {isDue && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#e8672a', flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#0f0e0c' }}>{word.word}</span>
            {word.phonetic && <span style={{ fontSize: 12, color: '#9e998e', fontFamily: 'monospace' }}>{word.phonetic}</span>}
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              color: FAMILIARITY_COLOR[word.familiarity] || '#9e998e',
              background: FAMILIARITY_BG[word.familiarity] || '#f5f3ef',
            }}>
              {FAMILIARITY_LABEL[word.familiarity] || '陌生'}
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#5c5850', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{word.meaning}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={e => { e.stopPropagation(); speak(word.word) }} style={{ fontSize: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>🔊</button>
          <span style={{ color: '#9e998e', transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'none', fontSize: 18 }}>›</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(0,0,0,0.06)' }} className="fade-in">
          {word.example && (
            <div style={{ marginTop: 12, background: '#f5f3ef', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ fontSize: 13, color: '#0f0e0c', fontStyle: 'italic' }}>"{word.example}"</p>
              {word.example_zh && <p style={{ fontSize: 12, color: '#5c5850', marginTop: 4 }}>{word.example_zh}</p>}
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
                fontSize: 10, fontWeight: 600, color: '#7b5ea7', background: '#f3eeff',
                border: '1px solid #d5c5f0', borderRadius: 20,
                padding: '2px 8px', marginTop: 10,
              }}>
                {icon} {label}
              </span>
            )
          })()}
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 12, color: '#9e998e', marginBottom: 8 }}>掌握程度</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {FAMILIARITY_LABEL.map((label, level) => (
                <button key={level} onClick={() => handleFamiliarity(level)} disabled={updating} style={{
                  flex: 1, padding: '6px 4px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                  border: `1.5px solid ${word.familiarity === level ? FAMILIARITY_COLOR[level] : '#e5e1d8'}`,
                  background: word.familiarity === level ? FAMILIARITY_BG[level] : '#f5f3ef',
                  color: word.familiarity === level ? FAMILIARITY_COLOR[level] : '#9e998e',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>{label}</button>
              ))}
            </div>
          </div>
          {nextReviewDate && (
            <p style={{ fontSize: 11, color: '#9e998e', marginTop: 8 }}>
              下次复习：{isDue ? <span style={{ color: '#e8672a', fontWeight: 600 }}>今天</span> : nextReviewDate.toLocaleDateString('zh-CN')}
            </p>
          )}
          <button onClick={handleDelete} style={{ marginTop: 12, fontSize: 12, color: '#d94040', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {deleting ? '删除中…' : '🗑 删除'}
          </button>
        </div>
      )}
    </div>
  )
}

/* ── 闪卡复习模式 ── */
const FlashCardReview = ({ words, onFinish, onUpdateFamiliarity }) => {
  const [mode, setMode] = useState('normal') // 'normal' | 'reverse' | 'compose'
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState([])
  const [updating, setUpdating] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const [answered, setAnswered] = useState(null) // null | 'correct' | 'wrong'
  const [composeResult, setComposeResult] = useState(null)
  const [composing, setComposing] = useState(false)
  const inputRef = useRef(null)

  const current = words[index]
  const total = words.length
  const progress = Math.round((index / total) * 100)
  const started = index > 0 || flipped

  const advance = async (level) => {
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
      setInputVal('')
      setAnswered(null)
      setComposeResult(null)
    }
  }

  const handleCompose = async () => {
    if (!inputVal.trim() || composing) return
    setComposing(true)
    try {
      const raw = await rateSentence(current.word, inputVal.trim())
      const data = JSON.parse(raw)
      setComposeResult(data)
      setFlipped(true)
    } catch {
      setComposeResult({ score: 0, feedback: '评分失败，请稍后重试', corrected: null })
      setFlipped(true)
    } finally {
      setComposing(false)
    }
  }

  const handleCheck = () => {
    if (!inputVal.trim()) return
    const correct = inputVal.trim().toLowerCase() === current.word.toLowerCase()
    setAnswered(correct ? 'correct' : 'wrong')
    setFlipped(true)
  }

  if (index >= total) {
    const counts = [0, 0, 0, 0]
    done.forEach(d => counts[d.level]++)
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', padding: '24px 16px', textAlign: 'center' }} className="fade-in">
        <p style={{ fontSize: 52, marginBottom: 12 }}>🎉</p>
        <h2 className="font-title" style={{ fontSize: 22, color: '#0f0e0c', marginBottom: 6 }}>复习完成！</h2>
        <p style={{ fontSize: 13, color: '#5c5850', marginBottom: 24 }}>共复习了 {total} 个单词</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {FAMILIARITY_LABEL.map((label, level) => counts[level] > 0 && (
            <div key={level} style={{ background: FAMILIARITY_BG[level], borderRadius: 14, padding: '14px 16px', border: `1px solid ${FAMILIARITY_COLOR[level]}30` }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: FAMILIARITY_COLOR[level] }}>{counts[level]}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: FAMILIARITY_COLOR[level] }}>{label}</p>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={onFinish} style={{ fontSize: 13, color: '#5c5850', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>← 退出</button>
        <div style={{ flex: 1, height: 6, background: '#e5e1d8', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #f28040, #e05020)', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontSize: 12, color: '#9e998e', flexShrink: 0 }}>{index}/{total}</span>
      </div>

      {/* 模式切换 */}
      {!started && (
        <div style={{ display: 'flex', background: '#f0ede6', borderRadius: 12, padding: 4, marginBottom: 16 }}>
          {[['normal', '英→中'], ['reverse', '中→英'], ['compose', '造句']].map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '7px 0', borderRadius: 9, fontSize: 12, fontWeight: 600,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: mode === m ? '#fff' : 'transparent',
              color: mode === m ? '#0f0e0c' : '#9e998e',
              boxShadow: mode === m ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>
      )}

      {mode === 'compose' ? (
        <div style={{
          background: '#fff',
          border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 24,
          padding: '32px 28px', textAlign: 'center',
          minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: 20,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9e998e', letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>用这个单词造句</p>
          <p style={{ fontSize: 34, fontWeight: 800, color: '#0f0e0c', marginBottom: 4 }}>{current.word}</p>
          {current.phonetic && <p style={{ fontSize: 12, color: '#9e998e', fontFamily: 'monospace', marginBottom: 8 }}>{current.phonetic}</p>}
          <p style={{ fontSize: 13, color: '#5c5850', marginBottom: 18 }}>{current.meaning}</p>
          {!flipped ? (
            <div style={{ width: '100%' }}>
              <textarea
                ref={inputRef}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="用英文造一个句子…"
                rows={2}
                autoFocus
                style={{
                  width: '100%', background: '#f5f3ef', border: '1.5px solid #e5e1d8',
                  borderRadius: 12, padding: '10px 14px', fontSize: 14, color: '#0f0e0c',
                  outline: 'none', boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#e8672a'}
                onBlur={e => e.target.style.borderColor = '#e5e1d8'}
              />
              <button onClick={handleCompose} disabled={!inputVal.trim() || composing} style={{
                width: '100%', marginTop: 10, padding: '12px',
                borderRadius: 12,
                background: inputVal.trim() && !composing ? 'linear-gradient(135deg, #f28040, #e05020)' : '#e5e1d8',
                color: inputVal.trim() && !composing ? '#fff' : '#9e998e',
                border: 'none', fontSize: 14, fontWeight: 700,
                cursor: inputVal.trim() && !composing ? 'pointer' : 'default',
                fontFamily: 'inherit',
                boxShadow: inputVal.trim() && !composing ? '0 3px 12px rgba(232,103,42,0.28)' : 'none',
              }}>
                {composing ? '✨ AI 评分中…' : '提交造句'}
              </button>
            </div>
          ) : composeResult && (
            <div className="fade-in" style={{ width: '100%' }}>
              <div style={{
                background: composeResult.score >= 70 ? '#eaf5ef' : '#fff3ee',
                borderRadius: 14, padding: '14px 16px', marginBottom: 12,
                border: `1px solid ${composeResult.score >= 70 ? '#3a9a5f30' : '#e8672a30'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: composeResult.score >= 70 ? '#3a9a5f' : '#e8672a' }}>
                    {composeResult.score >= 70 ? '✓' : '✎'} {composeResult.score} 分
                  </span>
                  <span style={{ fontSize: 12, color: '#9e998e', fontStyle: 'italic', maxWidth: '55%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{inputVal}"</span>
                </div>
                <p style={{ fontSize: 13, color: '#0f0e0c' }}>{composeResult.feedback}</p>
                {composeResult.corrected && (
                  <p style={{ fontSize: 12, color: '#3a9a5f', marginTop: 6 }}>建议：{composeResult.corrected}</p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : mode === 'normal' ? (
        <div
          onClick={() => !flipped && setFlipped(true)}
          style={{
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 24,
            padding: '40px 28px', textAlign: 'center', cursor: flipped ? 'default' : 'pointer',
            minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: 20,
            transition: 'box-shadow 0.2s',
          }}
          onMouseEnter={e => { if (!flipped) e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)' }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)' }}
        >
          <p style={{ fontSize: 38, fontWeight: 800, color: '#0f0e0c', marginBottom: 8 }}>{current.word}</p>
          {current.phonetic && <p style={{ fontSize: 14, color: '#9e998e', fontFamily: 'monospace', marginBottom: 12 }}>{current.phonetic}</p>}
          <button onClick={e => { e.stopPropagation(); speak(current.word) }} style={{ fontSize: 13, color: '#e8672a', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: 16, fontFamily: 'inherit' }}>🔊 听发音</button>
          {!flipped ? (
            <div style={{ marginTop: 8 }}>
              <div style={{ width: 40, height: 2, background: '#e5e1d8', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 12, color: '#9e998e' }}>点击翻转查看释义</p>
            </div>
          ) : (
            <div className="fade-in" style={{ marginTop: 8, width: '100%' }}>
              <div style={{ width: 40, height: 2, background: '#e8672a', margin: '0 auto 18px' }} />
              <p style={{ fontSize: 20, fontWeight: 700, color: '#0f0e0c', marginBottom: 8 }}>{current.meaning}</p>
              {current.example && (
                <div style={{ background: '#f5f3ef', borderRadius: 12, padding: '10px 14px', textAlign: 'left', marginTop: 10 }}>
                  <p style={{ fontSize: 13, color: '#0f0e0c', fontStyle: 'italic' }}>"{current.example}"</p>
                  {current.example_zh && <p style={{ fontSize: 12, color: '#5c5850', marginTop: 4 }}>{current.example_zh}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div style={{
          background: '#fff',
          border: `1.5px solid ${flipped ? (answered === 'correct' ? '#3a9a5f50' : '#d9404050') : 'rgba(0,0,0,0.07)'}`,
          borderRadius: 24, padding: '32px 28px', textAlign: 'center',
          minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: 20, transition: 'border-color 0.2s',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9e998e', letterSpacing: '0.08em', marginBottom: 12, textTransform: 'uppercase' }}>看释义写英文</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#0f0e0c', marginBottom: 6 }}>{current.meaning}</p>
          {current.example_zh && !flipped && (
            <p style={{ fontSize: 12, color: '#5c5850', fontStyle: 'italic', marginBottom: 8 }}>"{current.example_zh}"</p>
          )}
          {!flipped ? (
            <div style={{ width: '100%', marginTop: 16 }}>
              <input
                ref={inputRef}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCheck()}
                placeholder="输入英文单词…"
                autoFocus
                style={{
                  width: '100%', background: '#f5f3ef', border: '1.5px solid #e5e1d8',
                  borderRadius: 12, padding: '12px 14px', fontSize: 16, color: '#0f0e0c',
                  outline: 'none', boxSizing: 'border-box', textAlign: 'center',
                  fontFamily: 'inherit', letterSpacing: '0.05em', transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#e8672a'}
                onBlur={e => e.target.style.borderColor = '#e5e1d8'}
              />
              <button onClick={handleCheck} disabled={!inputVal.trim()} style={{
                width: '100%', marginTop: 10, padding: '12px',
                borderRadius: 12,
                background: inputVal.trim() ? 'linear-gradient(135deg, #f28040, #e05020)' : '#e5e1d8',
                color: inputVal.trim() ? '#fff' : '#9e998e',
                border: 'none', fontSize: 14, fontWeight: 700,
                cursor: inputVal.trim() ? 'pointer' : 'default',
                fontFamily: 'inherit',
                boxShadow: inputVal.trim() ? '0 3px 12px rgba(232,103,42,0.28)' : 'none',
                transition: 'all 0.15s',
              }}>确认</button>
            </div>
          ) : (
            <div className="fade-in" style={{ width: '100%', marginTop: 16 }}>
              {answered === 'correct' ? (
                <div style={{ background: '#eaf5ef', borderRadius: 14, padding: '14px 16px', border: '1px solid #3a9a5f30' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#3a9a5f', marginBottom: 4 }}>✓ 答对了！</p>
                  <p style={{ fontSize: 26, fontWeight: 800, color: '#3a9a5f' }}>{current.word}</p>
                </div>
              ) : (
                <div style={{ background: '#fdf0f0', borderRadius: 14, padding: '14px 16px', border: '1px solid #d9404030' }}>
                  <p style={{ fontSize: 12, color: '#d94040', marginBottom: 4 }}>✗ 你的答案：<span style={{ fontWeight: 600 }}>{inputVal}</span></p>
                  <p style={{ fontSize: 12, color: '#5c5850', marginBottom: 4 }}>正确答案：</p>
                  <p style={{ fontSize: 26, fontWeight: 800, color: '#0f0e0c' }}>{current.word}</p>
                  {current.phonetic && <p style={{ fontSize: 12, color: '#9e998e', fontFamily: 'monospace', marginTop: 4 }}>{current.phonetic}</p>}
                </div>
              )}
              <button onClick={() => speak(current.word)} style={{ fontSize: 13, color: '#e8672a', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0 0', fontFamily: 'inherit' }}>🔊 听发音</button>
            </div>
          )}
        </div>
      )}

      {/* 评级按钮（翻转后显示） */}
      {flipped && (
        <div className="fade-in">
          <p style={{ fontSize: 12, color: '#9e998e', textAlign: 'center', marginBottom: 10 }}>这个单词你掌握得怎么样？</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {FAMILIARITY_LABEL.map((label, level) => (
              <button key={level} onClick={() => advance(level)} disabled={updating} style={{
                padding: '12px 8px', borderRadius: 14, fontSize: 13, fontWeight: 700,
                border: `1.5px solid ${FAMILIARITY_COLOR[level]}50`,
                background: FAMILIARITY_BG[level], color: FAMILIARITY_COLOR[level],
                cursor: 'pointer', transition: 'opacity 0.15s, transform 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.opacity = '1' }}
              >
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

  const inputStyle = {
    width: '100%', background: '#f5f3ef', border: '1.5px solid #e5e1d8',
    borderRadius: 12, padding: '11px 14px', fontSize: 14, color: '#0f0e0c',
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', padding: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 640,
        margin: '0 auto', padding: '24px 20px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 800, fontSize: 18, color: '#0f0e0c' }}>添加单词</h3>
          <button onClick={onClose} style={{
            fontSize: 20, background: '#f5f3ef', border: 'none', cursor: 'pointer',
            color: '#5c5850', width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9e998e', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>单词 *</label>
            <input
              value={form.word}
              onChange={e => setForm({ ...form, word: e.target.value })}
              placeholder="e.g. persevere"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#e8672a'}
              onBlur={e => e.target.style.borderColor = '#e5e1d8'}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <button onClick={handleAiFill} disabled={aiLoading} style={{
              background: aiLoading ? '#e5e1d8' : '#fff3ee',
              color: aiLoading ? '#9e998e' : '#e8672a',
              border: `1.5px solid ${aiLoading ? '#e5e1d8' : '#f5c4a8'}`,
              borderRadius: 12, padding: '11px 14px',
              fontSize: 13, fontWeight: 700, cursor: aiLoading ? 'default' : 'pointer',
              whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}>
              {aiLoading ? '⏳ 填写中…' : '✨ AI 填写'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'meaning', label: '中文释义 *', placeholder: 'e.g. 坚持不懈，锲而不舍' },
            { key: 'example', label: '例句（英文）', placeholder: 'e.g. You must persevere if you want to succeed.' },
            { key: 'example_zh', label: '例句翻译', placeholder: 'e.g. 如果你想成功，就必须坚持不懈。' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9e998e', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
              <input
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#e8672a'}
                onBlur={e => e.target.style.borderColor = '#e5e1d8'}
              />
            </div>
          ))}
          {error && (
            <div style={{ background: '#fdf0f0', border: '1px solid #f5b0b0', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#d94040' }}>
              {error}
            </div>
          )}
          <Button onClick={handleSubmit} disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
            {loading ? '添加中…' : '添加到词汇本'}
          </Button>
        </div>
      </div>
    </div>
  )
}

const getSourceTag = (source) => {
  if (!source || source === 'manual') return '手动'
  if (source === 'snap') return '随拍'
  if (source === '语法练习') return '语法'
  if (source.startsWith('场景实战')) return '场景实战'
  if (source.startsWith('自如交流')) return '自如交流'
  if (source.startsWith('场景演绎')) return '场景演绎'
  if (source.startsWith('语音语调')) return '语音语调'
  if (source.startsWith('自然拼读')) return '自然拼读'
  if (source.startsWith('Emma')) return 'Emma'
  return '其他'
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
  const [tagFilter, setTagFilter] = useState(null)

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

  const availableTags = useMemo(() => {
    const tags = [...new Set(words.map(w => getSourceTag(w.source)))]
    return tags.length > 1 ? tags : []
  }, [words])

  const filtered = words.filter(w => {
    if (search && !w.word.toLowerCase().includes(search.toLowerCase()) && !w.meaning.includes(search)) return false
    if (tagFilter && getSourceTag(w.source) !== tagFilter) return false
    return true
  })
  const displayWords = tab === 'due' ? dueWords : filtered

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
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 className="font-title" style={{ fontSize: 28, color: '#0f0e0c', marginBottom: 4 }}>词汇本</h1>
          <p style={{ fontSize: 13, color: '#9e998e' }}>遗忘曲线 · 科学间隔复习</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          background: 'linear-gradient(135deg, #f28040, #e05020)',
          color: '#fff', border: 'none', borderRadius: 12,
          padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 3px 12px rgba(232,103,42,0.28)',
          fontFamily: 'inherit',
        }}>+ 添加</button>
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', background: '#f0ede6', borderRadius: 14, padding: 4, marginBottom: 16 }}>
        <button onClick={() => setTab('all')} style={{
          flex: 1, padding: '9px 0', borderRadius: 11, fontSize: 13, fontWeight: 700,
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          background: tab === 'all' ? '#fff' : 'transparent',
          color: tab === 'all' ? '#0f0e0c' : '#9e998e',
          boxShadow: tab === 'all' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
          transition: 'all 0.15s',
        }}>全部 ({words.length})</button>
        <button onClick={() => setTab('due')} style={{
          flex: 1, padding: '9px 0', borderRadius: 11, fontSize: 13, fontWeight: 700,
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          background: tab === 'due' ? '#fff' : 'transparent',
          color: tab === 'due' ? (dueWords.length > 0 ? '#e8672a' : '#0f0e0c') : '#9e998e',
          boxShadow: tab === 'due' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
          transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          今日复习
          {dueWords.length > 0 && (
            <span style={{
              background: 'linear-gradient(135deg, #f28040, #e05020)',
              color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700,
            }}>{dueWords.length}</span>
          )}
        </button>
      </div>

      {/* 遗忘曲线规则说明 */}
      {tab === 'due' && (
        <div style={{
          background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 16, padding: '12px 16px', marginBottom: 14,
          display: 'flex', gap: 12, alignItems: 'flex-start',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>📅</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f0e0c', marginBottom: 4 }}>遗忘曲线复习规则</p>
            <p style={{ fontSize: 12, color: '#5c5850', lineHeight: 1.6 }}>复习后按掌握程度评级，自动安排下次：</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {FAMILIARITY_LABEL.map((label, i) => {
                const days = ['+1天', '+3天', '+7天', '+14天']
                return (
                  <span key={label} style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                    background: FAMILIARITY_BG[i], color: FAMILIARITY_COLOR[i],
                    border: `1px solid ${FAMILIARITY_COLOR[i]}40`,
                  }}>
                    {label} {days[i]}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 搜索 */}
      {tab === 'all' && words.length > 0 && (
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  搜索单词或含义…"
          style={{
            width: '100%', background: '#fff', border: '1.5px solid #e5e1d8',
            borderRadius: 12, padding: '11px 16px', fontSize: 14, color: '#0f0e0c',
            outline: 'none', marginBottom: availableTags.length ? 10 : 16,
            boxSizing: 'border-box', fontFamily: 'inherit',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = '#e8672a'}
          onBlur={e => e.target.style.borderColor = '#e5e1d8'}
        />
      )}

      {/* 来源标签筛选 */}
      {tab === 'all' && availableTags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 14, scrollbarWidth: 'none' }}>
          <button onClick={() => setTagFilter(null)} style={{
            flexShrink: 0, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            border: `1.5px solid ${tagFilter === null ? '#e8672a' : '#e5e1d8'}`,
            background: tagFilter === null ? '#fff3ee' : '#fff',
            color: tagFilter === null ? '#e8672a' : '#5c5850',
            cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
          }}>全部</button>
          {availableTags.map(tag => (
            <button key={tag} onClick={() => setTagFilter(tagFilter === tag ? null : tag)} style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              border: `1.5px solid ${tagFilter === tag ? '#e8672a' : '#e5e1d8'}`,
              background: tagFilter === tag ? '#fff3ee' : '#fff',
              color: tagFilter === tag ? '#e8672a' : '#5c5850',
              cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
            }}>{tag}</button>
          ))}
        </div>
      )}

      {/* 熟练度统计 */}
      {tab === 'all' && words.length > 0 && !search && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {FAMILIARITY_LABEL.map((label, level) => {
            const count = words.filter(w => w.familiarity === level).length
            if (count === 0) return null
            return (
              <div key={level} style={{
                flex: 1, textAlign: 'center',
                background: FAMILIARITY_BG[level],
                border: `1px solid ${FAMILIARITY_COLOR[level]}30`,
                borderRadius: 12, padding: '10px 4px',
              }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: FAMILIARITY_COLOR[level] }}>{count}</p>
                <p style={{ fontSize: 10, fontWeight: 600, color: FAMILIARITY_COLOR[level] }}>{label}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* 今日复习入口 */}
      {tab === 'due' && dueWords.length > 0 && (
        <div style={{
          background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 18, padding: '18px 20px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0f0e0c', marginBottom: 4 }}>
              📅 今天有 <span style={{ color: '#e8672a' }}>{dueWords.length}</span> 个单词需要复习
            </p>
            <p style={{ fontSize: 12, color: '#9e998e' }}>翻卡模式 · 一个一个过 · 5分钟搞定</p>
          </div>
          <button onClick={() => setReviewMode(true)} style={{
            background: 'linear-gradient(135deg, #f28040, #e05020)',
            color: '#fff', border: 'none', borderRadius: 12,
            padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            flexShrink: 0, fontFamily: 'inherit',
            boxShadow: '0 3px 12px rgba(232,103,42,0.28)',
          }}>开始复习 →</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p className="spin" style={{ display: 'inline-block', fontSize: 28 }}>⏳</p>
        </div>
      ) : displayWords.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 20, padding: '48px 24px', textAlign: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>
            {tab === 'due' ? '🎉' : search ? '🔍' : '📚'}
          </p>
          <p style={{ fontWeight: 700, fontSize: 16, color: '#0f0e0c', marginBottom: 8 }}>
            {tab === 'due' ? '今天没有需要复习的单词' : search ? '没有匹配的单词' : '词汇本还是空的'}
          </p>
          <p style={{ fontSize: 13, color: '#9e998e', lineHeight: 1.6 }}>
            {tab === 'due' ? '太棒了！所有单词都复习完了 🙌' : search ? '换个关键词试试' : '上场景实战或自如交流课时，点击词汇旁的 + 可一键存入；也可点击右上角"+ 添加"手动录入'}
          </p>
          {tab === 'all' && !search && (
            <Button onClick={() => setShowAdd(true)} style={{ marginTop: 20 }}>手动添加单词</Button>
          )}
        </div>
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

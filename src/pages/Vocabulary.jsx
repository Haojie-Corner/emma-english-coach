import { useState, useEffect, useCallback } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import useUserStore from '../store/userStore'
import { getVocabulary, getDueVocabulary, addVocabularyWord, updateVocabularyFamiliarity, deleteVocabularyWord } from '../services/supabase'
import { speak } from '../utils/tts'

const FAMILIARITY_LABEL = ['陌生', '模糊', '熟悉', '掌握']
const FAMILIARITY_COLOR = ['#c45c5c', '#d97757', '#788c5d', '#5a7a3a']
const FAMILIARITY_BG = ['#fdeaea', '#fdf0ea', '#eaf2e3', '#d8edca']

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
      background: '#fff', border: `1.5px solid ${isDue ? '#f5c4a8' : '#dedad0'}`,
      borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.15s',
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
      >
        {isDue && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97757', flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#1a1917' }}>{word.word}</span>
            {word.phonetic && <span style={{ fontSize: 12, color: '#b0aea5', fontFamily: 'monospace' }}>{word.phonetic}</span>}
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              color: FAMILIARITY_COLOR[word.familiarity] || '#7a7870',
              background: FAMILIARITY_BG[word.familiarity] || '#f0ede4',
            }}>{FAMILIARITY_LABEL[word.familiarity] || '陌生'}</span>
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
          {word.source && <p style={{ fontSize: 11, color: '#b0aea5', marginTop: 6 }}>来源：{word.source}</p>}

          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 12, color: '#7a7870', marginBottom: 8 }}>掌握程度</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {FAMILIARITY_LABEL.map((label, level) => (
                <button
                  key={level}
                  onClick={() => handleFamiliarity(level)}
                  disabled={updating}
                  style={{
                    flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                    border: `1.5px solid ${word.familiarity === level ? FAMILIARITY_COLOR[level] : '#dedad0'}`,
                    background: word.familiarity === level ? FAMILIARITY_BG[level] : '#faf9f5',
                    color: word.familiarity === level ? FAMILIARITY_COLOR[level] : '#7a7870',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >{label}</button>
              ))}
            </div>
          </div>

          {nextReviewDate && (
            <p style={{ fontSize: 11, color: '#b0aea5', marginTop: 8 }}>
              下次复习：{isDue ? '今天' : nextReviewDate.toLocaleDateString('zh-CN')}
            </p>
          )}

          <button
            onClick={handleDelete}
            style={{ marginTop: 12, fontSize: 12, color: '#c45c5c', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {deleting ? '删除中…' : '🗑 删除'}
          </button>
        </div>
      )}
    </div>
  )
}

const AddWordModal = ({ onClose, onAdd, userId }) => {
  const [form, setForm] = useState({ word: '', phonetic: '', meaning: '', example: '', example_zh: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const fields = [
    { key: 'word', label: '单词 *', placeholder: 'e.g. persevere' },
    { key: 'phonetic', label: '音标', placeholder: '/ˌpɜːr.sɪˈvɪər/' },
    { key: 'meaning', label: '中文释义 *', placeholder: 'e.g. 坚持不懈，锲而不舍' },
    { key: 'example', label: '例句（英文）', placeholder: 'e.g. You must persevere if you want to succeed.' },
    { key: 'example_zh', label: '例句翻译', placeholder: 'e.g. 如果你想成功，就必须坚持不懈。' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', padding: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 640, margin: '0 auto', padding: '24px 20px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, color: '#1a1917' }}>手动添加单词</h3>
          <button onClick={onClose} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#b0aea5' }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fields.map(({ key, label, placeholder }) => (
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
          <Button onClick={handleSubmit} disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? '添加中…' : '添加到词汇本'}
          </Button>
        </div>
      </div>
    </div>
  )
}

const Vocabulary = () => {
  const { user } = useUserStore()
  const [tab, setTab] = useState('all')
  const [words, setWords] = useState([])
  const [dueWords, setDueWords] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h1 className="text-xl font-bold text-[#141413]" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
            📖 词汇本
          </h1>
          <p className="text-sm text-[#b0aea5] mt-1">基于遗忘曲线安排复习，学过的单词不再忘</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{ background: '#d97757', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          + 添加
        </button>
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', background: '#f0ede4', borderRadius: 12, padding: 4, margin: '16px 0' }}>
        <button onClick={() => setTab('all')} style={{
          flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 13, fontWeight: 600,
          border: 'none', cursor: 'pointer',
          background: tab === 'all' ? '#fff' : 'transparent',
          color: tab === 'all' ? '#141413' : '#b0aea5',
          boxShadow: tab === 'all' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          fontFamily: 'inherit',
        }}>全部 ({words.length})</button>
        <button onClick={() => setTab('due')} style={{
          flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 13, fontWeight: 600,
          border: 'none', cursor: 'pointer',
          background: tab === 'due' ? '#fff' : 'transparent',
          color: tab === 'due' ? (dueWords.length > 0 ? '#d97757' : '#141413') : '#b0aea5',
          boxShadow: tab === 'due' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          fontFamily: 'inherit',
        }}>
          今日复习 {dueWords.length > 0 && <span style={{ background: '#d97757', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10 }}>{dueWords.length}</span>}
        </button>
      </div>

      {/* 搜索（全部词汇时显示） */}
      {tab === 'all' && words.length > 0 && (
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索单词或含义…"
          style={{ width: '100%', background: '#faf9f5', border: '1.5px solid #dedad0', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#1a1917', outline: 'none', marginBottom: 16, boxSizing: 'border-box' }}
          onFocus={e => e.target.style.borderColor = '#d97757'}
          onBlur={e => e.target.style.borderColor = '#dedad0'}
        />
      )}

      {/* 统计摘要 */}
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

      {/* 今日复习提示 */}
      {tab === 'due' && dueWords.length > 0 && (
        <Card style={{ background: '#fdf0ea', border: '1px solid #f5c4a8', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: '#d97757' }}>📅 今天有 <strong>{dueWords.length}</strong> 个单词需要复习。更新掌握程度后，下次复习时间会自动调整。</p>
        </Card>
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
            {tab === 'due' ? '太棒了！所有单词都复习完了 🙌' : search ? '换个关键词试试' : '完成课程学习后，生词会自动保存到这里'}
          </p>
          {tab === 'all' && !search && (
            <Button onClick={() => setShowAdd(true)} style={{ marginTop: 16 }}>手动添加单词</Button>
          )}
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayWords.map(word => (
            <WordCard
              key={word.word}
              word={word}
              onFamiliarityChange={handleFamiliarityChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddWordModal
          userId={user?.id}
          onClose={() => setShowAdd(false)}
          onAdd={loadWords}
        />
      )}
    </div>
  )
}

export default Vocabulary

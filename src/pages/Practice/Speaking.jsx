import { useState } from 'react'
import AudioRecorder from '../../components/AudioRecorder'
import { correctGrammar } from '../../services/deepseek'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const Speaking = () => {
  const [mode, setMode] = useState('free')  // free | grammar
  const [grammarText, setGrammarText] = useState('')
  const [grammarResult, setGrammarResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGrammarCheck = async () => {
    if (!grammarText.trim()) return
    setLoading(true)
    setError('')
    setGrammarResult(null)
    try {
      const raw = await correctGrammar(grammarText)
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) setGrammarResult(JSON.parse(match[0]))
      else setError('AI 解析失败，请重试')
    } catch (e) {
      setError('请求失败：' + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-[#141413] mb-2" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
        💬 练习中心
      </h1>
      <p className="text-sm text-[#b0aea5] mb-6">自由口语练习 + 语法纠错</p>

      <div className="flex bg-[#f0ede4] rounded-xl p-1 mb-6">
        {[['free', '🎤 自由录音'], ['grammar', '📝 语法纠错']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === key ? 'bg-white text-[#141413] shadow-sm' : 'text-[#b0aea5]'}`}
            style={{ fontFamily: 'Poppins, Arial, sans-serif' }}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'free' && (
        <div>
          <Card className="mb-4 bg-[#f5e6df] border-[#f5e6df]">
            <p className="text-sm text-[#d97757]">💡 用英文说任何你想说的，AI 会分析你的发音并给出反馈</p>
          </Card>
          <AudioRecorder
            targetText="Say anything in English!"
            targetZh="用英文说任何你想说的话"
            lessonId="free_practice"
          />
        </div>
      )}

      {mode === 'grammar' && (
        <div className="space-y-4">
          <Card>
            <p className="text-sm text-[#b0aea5] mb-3">输入一段英文，AI 帮你找出语法问题并给出修改建议</p>
            <textarea
              value={grammarText}
              onChange={e => setGrammarText(e.target.value)}
              placeholder="Type your English here... e.g. I go to school yesterday."
              rows={4}
              className="w-full bg-[#faf9f5] border border-[#e8e6dc] rounded-xl px-4 py-3 text-sm text-[#141413] outline-none focus:border-[#d97757] transition-colors resize-none"
            />
            <Button onClick={handleGrammarCheck} disabled={loading || !grammarText.trim()} className="w-full mt-3">
              {loading ? '分析中…' : '🤖 AI 语法检查'}
            </Button>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </Card>

          {grammarResult && (
            <div className="space-y-3 fade-in">
              <Card>
                <p className="text-xs text-[#b0aea5] mb-1">修改后的正确版本</p>
                <p className="text-[#141413] font-medium">{grammarResult.corrected}</p>
              </Card>
              {grammarResult.issues?.length > 0 && (
                <Card>
                  <p className="text-sm font-semibold text-[#141413] mb-3">📝 语法问题</p>
                  <div className="space-y-3">
                    {grammarResult.issues.map((issue, i) => (
                      <div key={i} className="border-l-2 border-[#d97757] pl-3">
                        <p className="text-sm"><span className="line-through text-[#b0aea5]">{issue.error}</span> → <span className="text-[#d97757] font-medium">{issue.correction}</span></p>
                        <p className="text-xs text-[#b0aea5]">{issue.reason}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {grammarResult.grammar_tip && (
                <Card className="bg-[#f5e6df] border-[#f5e6df]">
                  <p className="text-sm text-[#d97757]">💡 语法小贴士：{grammarResult.grammar_tip}</p>
                </Card>
              )}
              {grammarResult.encouragement && (
                <p className="text-sm text-[#788c5d] text-center">{grammarResult.encouragement}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Speaking

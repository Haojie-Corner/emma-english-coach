import useAudioRecorder from '../hooks/useAudioRecorder'
import { analyzePronunciation } from '../services/gemini'
import { useState } from 'react'
import Button from './ui/Button'
import Card from './ui/Card'

const ScoreRing = ({ score }) => {
  const r = 32
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? '#788c5d' : score >= 60 ? '#d97757' : '#e05c5c'
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#e8e6dc" strokeWidth="6" />
      <circle
        cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 40 40)"
        style={{ transition: 'stroke-dashoffset 1s ease-out' }}
      />
      <text x="40" y="45" textAnchor="middle" fontSize="16" fontWeight="700" fill={color} fontFamily="Poppins,Arial,sans-serif">
        {score}
      </text>
    </svg>
  )
}

const AudioRecorder = ({ targetText, targetZh, lessonId }) => {
  const { status, audioUrl, error, startRecording, stopRecording, reset, getBase64 } = useAudioRecorder()
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [analyzeError, setAnalyzeError] = useState(null)

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      const base64 = await getBase64()
      const feedback = await analyzePronunciation(base64, targetText)
      setResult(feedback)
    } catch (e) {
      setAnalyzeError('AI 分析失败，请重试：' + e.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleReset = () => {
    reset()
    setResult(null)
    setAnalyzeError(null)
  }

  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(targetText)
    utterance.lang = 'en-US'
    utterance.rate = 0.85
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className="space-y-4">
      {/* 练习目标 */}
      <Card>
        <p className="text-xs text-[#b0aea5] mb-1">练习内容</p>
        <p className="text-xl font-bold text-[#141413] mb-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{targetText}</p>
        {targetZh && <p className="text-sm text-[#b0aea5]">{targetZh}</p>}
        <Button variant="secondary" size="sm" onClick={speak} className="mt-3">
          🔊 听标准发音
        </Button>
      </Card>

      {/* 录音控制 */}
      <div className="flex flex-col items-center gap-4 py-4">
        {!result && (
          <>
            <button
              onClick={status === 'recording' ? stopRecording : startRecording}
              disabled={status === 'processing' || analyzing}
              className={`w-18 h-18 rounded-full flex items-center justify-center text-2xl transition-all duration-200
                ${status === 'recording'
                  ? 'bg-red-500 text-white recording-pulse'
                  : 'bg-[#d97757] hover:bg-[#c4633e] text-white'}
                disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ width: 72, height: 72 }}
            >
              {status === 'recording' ? '⏹' : '🎤'}
            </button>
            <p className="text-sm text-[#b0aea5]">
              {status === 'idle' && '点击开始录音'}
              {status === 'recording' && '录音中…点击停止'}
              {status === 'processing' && '处理中…'}
              {status === 'done' && '录音完成'}
            </p>
          </>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        {status === 'done' && !result && (
          <div className="flex flex-col items-center gap-3 w-full">
            <audio src={audioUrl} controls className="w-full max-w-xs rounded-lg" />
            <div className="flex gap-3">
              <Button onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? <span className="spin inline-block">⟳</span> : '🤖'} AI 分析发音
              </Button>
              <Button variant="secondary" onClick={handleReset}>重新录音</Button>
            </div>
            {analyzeError && <p className="text-sm text-red-500">{analyzeError}</p>}
          </div>
        )}
      </div>

      {/* AI 分析结果 */}
      {result && (
        <div className="space-y-3 fade-in">
          <Card className="flex items-center gap-5">
            <ScoreRing score={result.overall_score} />
            <div>
              <p className="text-xs text-[#b0aea5] mb-1">发音评分</p>
              <p className="font-semibold text-[#141413]">{result.positive_feedback}</p>
            </div>
          </Card>

          {result.pronunciation_issues?.length > 0 && (
            <Card>
              <p className="text-sm font-semibold text-[#141413] mb-3">📝 需要改进</p>
              <div className="space-y-3">
                {result.pronunciation_issues.map((issue, i) => (
                  <div key={i} className="border-l-2 border-[#d97757] pl-3">
                    <p className="font-mono text-sm font-bold text-[#141413]">{issue.word} <span className="text-[#b0aea5] font-normal">{issue.correct_ipa}</span></p>
                    <p className="text-sm text-[#b0aea5]">{issue.issue}</p>
                    <p className="text-sm text-[#788c5d]">💡 {issue.tip}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {result.next_focus && (
            <Card className="bg-[#f5e6df] border-[#f5e6df]">
              <p className="text-sm text-[#d97757]">🎯 下次练习重点：{result.next_focus}</p>
            </Card>
          )}

          <div className="flex gap-3">
            <Button onClick={handleReset} className="flex-1">再练一次</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AudioRecorder

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getLesson } from '../../data/phonics'
import AudioRecorder from '../../components/AudioRecorder'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import useUserStore from '../../store/userStore'
import useProgressStore from '../../store/progressStore'

const speak = (text) => {
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.85
  window.speechSynthesis.speak(u)
}

const LetterCard = ({ item }) => (
  <Card className="flex flex-col items-center gap-2 py-4 cursor-pointer hover:border-[#d97757] transition-colors" onClick={() => speak(item.letter)}>
    <span className="text-4xl font-bold text-[#141413]" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>{item.letter}</span>
    <span className="text-xs font-mono text-[#b0aea5]">{item.ipa}</span>
    <div className="text-center">
      <span className="text-sm font-semibold text-[#d97757]">{item.example}</span>
      <span className="text-xs text-[#b0aea5] block">{item.example_zh}</span>
    </div>
    <p className="text-xs text-[#b0aea5] text-center px-2">{item.tip}</p>
  </Card>
)

const PhonicsLesson = () => {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const { user } = useUserStore()
  const { updateProgress } = useProgressStore()
  const [tab, setTab] = useState('learn')    // learn | practice
  const [practiceIndex, setPracticeIndex] = useState(0)
  const [completedTargets, setCompletedTargets] = useState(new Set())

  const lesson = getLesson(lessonId)

  if (!lesson) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-[#b0aea5]">课程不存在</p>
        <Button onClick={() => navigate('/course/phonics')} className="mt-4" variant="secondary">返回</Button>
      </div>
    )
  }

  const currentTarget = lesson.practice.targets[practiceIndex]

  const handleMarkComplete = async () => {
    const next = new Set(completedTargets)
    next.add(practiceIndex)
    setCompletedTargets(next)
    if (user) {
      const allDone = next.size >= lesson.practice.targets.length
      await updateProgress(user.id, 'phonics', lesson.id, allDone ? 'completed' : 'in_progress', null)
    }
    if (practiceIndex < lesson.practice.targets.length - 1) {
      setPracticeIndex(practiceIndex + 1)
    }
  }

  const allDone = completedTargets.size >= lesson.practice.targets.length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 返回 + 标题 */}
      <button onClick={() => navigate('/course/phonics')} className="flex items-center gap-1 text-sm text-[#b0aea5] hover:text-[#141413] mb-4 transition-colors">
        ← 自然拼读
      </button>
      <h1 className="text-xl font-bold text-[#141413] mb-1" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
        {lesson.title}
      </h1>
      <p className="text-sm text-[#b0aea5] mb-6">{lesson.description}</p>

      {/* Tab */}
      <div className="flex bg-[#f0ede4] rounded-xl p-1 mb-6">
        {[['learn', '📖 学习内容'], ['practice', '🎤 发音练习']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${tab === key ? 'bg-white text-[#141413] shadow-sm' : 'text-[#b0aea5]'}`}
            style={{ fontFamily: 'Poppins, Arial, sans-serif' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 学习内容 */}
      {tab === 'learn' && (
        <div className="space-y-8">
          {lesson.sections.map(section => (
            <div key={section.id}>
              <div className="mb-4">
                <h2 className="text-base font-semibold text-[#141413]" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
                  {section.title}
                </h2>
                <p className="text-sm text-[#b0aea5]">{section.subtitle}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {section.items.map(item => (
                  <LetterCard key={item.letter} item={item} />
                ))}
              </div>
            </div>
          ))}

          <div className="pt-4">
            <Button onClick={() => setTab('practice')} className="w-full" size="lg">
              开始发音练习 🎤
            </Button>
          </div>
        </div>
      )}

      {/* 发音练习 */}
      {tab === 'practice' && (
        <div>
          <div className="mb-6">
            <p className="text-sm text-[#b0aea5] mb-3">{lesson.practice.instructions}</p>

            {/* 练习目标选择 */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
              {lesson.practice.targets.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setPracticeIndex(i)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    i === practiceIndex
                      ? 'bg-[#d97757] text-white'
                      : completedTargets.has(i)
                      ? 'bg-[#788c5d]/20 text-[#788c5d] border border-[#788c5d]/40'
                      : 'bg-[#f0ede4] text-[#b0aea5]'
                  }`}
                  style={{ fontFamily: 'Poppins, Arial, sans-serif' }}
                >
                  {completedTargets.has(i) ? '✅' : `${i + 1}`}
                  {t.zh}
                </button>
              ))}
            </div>

            <AudioRecorder
              key={practiceIndex}
              targetText={currentTarget.text}
              targetZh={currentTarget.zh}
              lessonId={lesson.id}
            />

            {!allDone && (
              <Button
                variant="secondary"
                onClick={handleMarkComplete}
                className="w-full mt-4"
              >
                ✅ 完成这个练习，下一个
              </Button>
            )}

            {allDone && (
              <Card className="mt-4 text-center bg-[#f5e6df] border-[#f5e6df]">
                <p className="text-lg">🎉</p>
                <p className="font-semibold text-[#d97757]">第一课完成！</p>
                <p className="text-sm text-[#b0aea5] mb-3">继续保持，你做得很棒！</p>
                <Button onClick={() => navigate('/dashboard')}>返回首页</Button>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PhonicsLesson

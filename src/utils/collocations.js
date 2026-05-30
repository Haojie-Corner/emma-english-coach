const COLLOCATION_BANK = {
  progress: ['make progress', 'steady progress', 'significant progress'],
  responsibility: ['take responsibility', 'personal responsibility', 'shared responsibility'],
  decision: ['make a decision', 'final decision', 'difficult decision'],
  advice: ['give advice', 'useful advice', 'follow advice'],
  effort: ['make an effort', 'extra effort', 'consistent effort'],
  mistake: ['make a mistake', 'common mistake', 'learn from mistakes'],
  problem: ['solve a problem', 'serious problem', 'common problem'],
  opportunity: ['take an opportunity', 'great opportunity', 'miss an opportunity'],
  experience: ['gain experience', 'valuable experience', 'learning experience'],
  skill: ['develop a skill', 'practical skill', 'communication skills'],
  confidence: ['build confidence', 'gain confidence', 'lose confidence'],
  habit: ['build a habit', 'daily habit', 'bad habit'],
  goal: ['set a goal', 'achieve a goal', 'long-term goal'],
  plan: ['make a plan', 'clear plan', 'backup plan'],
  argument: ['strong argument', 'weak argument', 'support an argument'],
  point: ['make a point', 'good point', 'main point'],
  question: ['ask a question', 'answer a question', 'difficult question'],
  chance: ['take a chance', 'good chance', 'second chance'],
  change: ['make a change', 'big change', 'positive change'],
  choice: ['make a choice', 'smart choice', 'limited choice'],
  // Extended bank
  impression: ['make an impression', 'first impression', 'lasting impression'],
  suggestion: ['make a suggestion', 'follow a suggestion', 'practical suggestion'],
  improvement: ['show improvement', 'continuous improvement', 'make an improvement'],
  attention: ['pay attention', 'attract attention', 'draw attention'],
  difference: ['make a difference', 'key difference', 'notice a difference'],
  impact: ['have an impact', 'positive impact', 'long-term impact'],
  relationship: ['build a relationship', 'strong relationship', 'maintain a relationship'],
  time: ['take time', 'waste time', 'save time', 'spend time'],
  work: ['hard work', 'teamwork', 'get to work', 'work together'],
  mind: ['change your mind', 'keep in mind', 'make up your mind'],
  note: ['take notes', 'make a note', 'keynote'],
  speech: ['give a speech', 'deliver a speech', 'public speech'],
  feedback: ['give feedback', 'receive feedback', 'constructive feedback'],
  mistake: ['make a mistake', 'repeat a mistake', 'correct a mistake'],
  research: ['do research', 'conduct research', 'research shows'],
  interest: ['show interest', 'take an interest', 'areas of interest'],
  support: ['offer support', 'emotional support', 'provide support'],
  benefit: ['offer a benefit', 'mutual benefit', 'reap the benefits'],
  challenge: ['face a challenge', 'accept a challenge', 'meet a challenge'],
  solution: ['find a solution', 'practical solution', 'come up with a solution'],
}

const zhHint = (word) => ({
  progress: '取得进步',
  responsibility: '承担责任',
  decision: '做决定',
  advice: '给建议/采纳建议',
  effort: '努力',
  mistake: '犯错/从错误中学习',
  problem: '解决问题',
  opportunity: '抓住机会',
  experience: '获得经验',
  skill: '培养技能',
  confidence: '建立自信',
  habit: '养成习惯',
  goal: '设定/实现目标',
  plan: '制定计划',
  argument: '有力论点',
  point: '表达观点',
  question: '提问/回答问题',
  chance: '抓住机会',
  change: '做出改变',
  choice: '做选择',
  impression: '留下印象',
  suggestion: '提建议',
  improvement: '进步改善',
  attention: '集中注意力',
  difference: '产生差异',
  impact: '产生影响',
  relationship: '建立关系',
  time: '时间管理',
  work: '工作/努力',
  mind: '改变/下定决心',
  note: '做笔记',
  speech: '发表演讲',
  feedback: '给反馈',
  research: '研究/调查',
  interest: '表达兴趣',
  support: '提供支持',
  benefit: '获得好处',
  challenge: '面对挑战',
  solution: '找到解决方案',
}[word.toLowerCase()] || '常用词块')

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const buildCollocationDrills = (words) => {
  const drills = []

  words.forEach(item => {
    const key = item.word?.toLowerCase()
    const phrases = COLLOCATION_BANK[key] || []
    phrases.forEach(phrase => {
      drills.push({
        word: item.word,
        phrase,
        answer: phrase,
        prompt: phrase.replace(new RegExp(`\\b${key}\\b`, 'i'), '_____'),
        meaning: zhHint(key),
        example: item.example || '',
      })
    })
  })

  if (drills.length >= 4) return drills

  words.forEach(item => {
    if (!item.example || !item.word) return
    const pattern = new RegExp(`\\b${escapeRegExp(item.word)}\\b`, 'i')
    if (!pattern.test(item.example)) return
    drills.push({
      word: item.word,
      phrase: item.example.match(pattern)?.[0] || item.word,
      answer: item.word,
      prompt: item.example.replace(pattern, '_____'),
      meaning: item.meaning || '根据例句补全表达',
      example: item.example,
    })
  })

  return drills.slice(0, 20)
}

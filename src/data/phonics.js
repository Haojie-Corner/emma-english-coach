export const phonicsLessons = [
  {
    id: 'phonics_01',
    title: 'Lesson 1 — 26个字母发音',
    subtitle: '元音字母与辅音字母',
    description: '英语有26个字母，分为5个元音（A E I O U）和21个辅音。元音是英语发音的核心，每个单词都至少含有一个元音音节。',
    objectives: ['认识并读出26个英文字母', '区分元音字母和辅音字母', '了解字母在单词中的作用'],
    sections: [
      {
        id: 'vowels',
        title: '五个元音字母 Vowels',
        subtitle: 'A / E / I / O / U',
        items: [
          { letter: 'A', ipa: '/eɪ/', example: 'apple', example_ipa: '/ˈæpl/', example_zh: '苹果', tip: '嘴巴张大，像医生让你说"啊"' },
          { letter: 'E', ipa: '/iː/', example: 'egg',   example_ipa: '/ɛɡ/',   example_zh: '鸡蛋', tip: '嘴角向两边拉，像在微笑' },
          { letter: 'I', ipa: '/aɪ/', example: 'ice',   example_ipa: '/aɪs/',  example_zh: '冰',   tip: '从"啊"滑向"伊"，嘴巴慢慢收' },
          { letter: 'O', ipa: '/oʊ/', example: 'open',  example_ipa: '/ˈoʊpən/', example_zh: '打开', tip: '嘴巴圆圆的，像在说"哦"' },
          { letter: 'U', ipa: '/juː/', example: 'unit', example_ipa: '/ˈjuːnɪt/', example_zh: '单位', tip: '嘴唇向前撅，像在说"于"' },
        ],
      },
      {
        id: 'consonants',
        title: '21个辅音字母 Consonants',
        subtitle: 'B C D F G H J K L M N P Q R S T V W X Y Z',
        items: [
          { letter: 'B', ipa: '/biː/', example: 'ball',  example_ipa: '/bɔːl/',  example_zh: '球',  tip: '双唇紧闭后爆破发音' },
          { letter: 'C', ipa: '/siː/', example: 'cat',   example_ipa: '/kæt/',   example_zh: '猫',  tip: '在a/o/u前发/k/，在e/i/y前发/s/' },
          { letter: 'D', ipa: '/diː/', example: 'dog',   example_ipa: '/dɒɡ/',   example_zh: '狗',  tip: '舌尖顶上齿龈爆破发音' },
          { letter: 'F', ipa: '/ɛf/',  example: 'fish',  example_ipa: '/fɪʃ/',   example_zh: '鱼',  tip: '上齿咬下唇，气流摩擦' },
          { letter: 'G', ipa: '/dʒiː/', example: 'go',   example_ipa: '/ɡoʊ/',   example_zh: '去',  tip: '喉咙深处爆破，像"格"' },
          { letter: 'H', ipa: '/eɪtʃ/', example: 'hat',  example_ipa: '/hæt/',   example_zh: '帽子', tip: '呼气发音，像哈气' },
          { letter: 'J', ipa: '/dʒeɪ/', example: 'jump', example_ipa: '/dʒʌmp/', example_zh: '跳',  tip: '舌尖卷起，像中文"纠"' },
          { letter: 'K', ipa: '/keɪ/', example: 'kite',  example_ipa: '/kaɪt/',  example_zh: '风筝', tip: '与C类似，喉咙爆破' },
          { letter: 'L', ipa: '/ɛl/',  example: 'lion',  example_ipa: '/ˈlaɪən/', example_zh: '狮子', tip: '舌尖触上齿龈，边音流出' },
          { letter: 'M', ipa: '/ɛm/',  example: 'moon',  example_ipa: '/muːn/',  example_zh: '月亮', tip: '双唇闭合，气流从鼻腔出' },
          { letter: 'N', ipa: '/ɛn/',  example: 'nose',  example_ipa: '/noʊz/',  example_zh: '鼻子', tip: '舌尖顶上齿龈，气流从鼻腔出' },
          { letter: 'P', ipa: '/piː/', example: 'pen',   example_ipa: '/pɛn/',   example_zh: '钢笔', tip: '双唇紧闭后爆破，像B但不振动声带' },
          { letter: 'Q', ipa: '/kjuː/', example: 'queen', example_ipa: '/kwiːn/', example_zh: '女王', tip: '总与U配对，发/kw/音' },
          { letter: 'R', ipa: '/ɑːr/', example: 'run',   example_ipa: '/rʌn/',   example_zh: '跑',  tip: '舌头卷起但不触碰上颚' },
          { letter: 'S', ipa: '/ɛs/',  example: 'sun',   example_ipa: '/sʌn/',   example_zh: '太阳', tip: '牙关微开，气流从牙缝摩擦出' },
          { letter: 'T', ipa: '/tiː/', example: 'tree',  example_ipa: '/triː/',  example_zh: '树',  tip: '舌尖顶上齿龈爆破，不振动声带' },
          { letter: 'V', ipa: '/viː/', example: 'very',  example_ipa: '/ˈvɛri/', example_zh: '很',  tip: '上齿咬下唇，声带振动（比F有声）' },
          { letter: 'W', ipa: '/ˈdʌbljuː/', example: 'water', example_ipa: '/ˈwɔːtər/', example_zh: '水', tip: '嘴唇圆撅后快速张开' },
          { letter: 'X', ipa: '/ɛks/', example: 'box',   example_ipa: '/bɒks/',  example_zh: '盒子', tip: '发/ks/组合音' },
          { letter: 'Y', ipa: '/waɪ/', example: 'yes',   example_ipa: '/jɛs/',   example_zh: '是',  tip: '舌面接近上颚，像"叶"的开头' },
          { letter: 'Z', ipa: '/zɛd/', example: 'zoo',   example_ipa: '/zuː/',   example_zh: '动物园', tip: '像S但声带振动，更有声' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: '跟着示范朗读下面的字母，然后录音让 AI 给你评分！',
      targets: [
        { text: 'A E I O U', zh: '五个元音字母', type: 'alphabet' },
        { text: 'apple, egg, ice, open, unit', zh: 'a/e/i/o/u 开头的单词', type: 'words' },
        { text: 'The big cat sat on a mat.', zh: '大猫坐在垫子上。', type: 'sentence' },
      ],
    },
  },
]

export const getLesson = (lessonId) => phonicsLessons.find(l => l.id === lessonId)

export const modules = [
  { id: 'phonics',     name: '自然拼读',   nameEn: 'Phonics',     icon: '🔤', totalLessons: 22, color: '#d97757' },
  { id: 'intonation',  name: '语音语调',   nameEn: 'Intonation',  icon: '🎵', totalLessons: 11, color: '#6a9bcc' },
  { id: 'mindset',     name: '认知重塑',   nameEn: 'Mindset',     icon: '🧠', totalLessons: 30, color: '#788c5d' },
  { id: 'scenes',      name: '场景实战',   nameEn: 'Scenes',      icon: '💬', totalLessons: 84, color: '#9b7ec8' },
  { id: 'demo',        name: '场景演绎',   nameEn: 'Demo',        icon: '🎬', totalLessons: 21, color: '#c4a35a' },
  { id: 'tech',        name: '编程英语',   nameEn: 'Tech English', icon: '💻', totalLessons: 20, color: '#5a8c7c' },
]

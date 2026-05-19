export const phonicsLessons = [
  // ─── Lesson 1: 26个字母 ───────────────────────────────────────────
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
          { letter: 'G', ipa: '/dʒiː/', example: 'go',   example_ipa: '/ɡoʊ/',  example_zh: '去',  tip: '喉咙深处爆破，像"格"' },
          { letter: 'H', ipa: '/eɪtʃ/', example: 'hat',  example_ipa: '/hæt/',  example_zh: '帽子', tip: '呼气发音，像哈气' },
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

  // ─── Lesson 2: 短元音 a /æ/ ───────────────────────────────────────
  {
    id: 'phonics_02',
    title: 'Lesson 2 — 短元音 a',
    subtitle: '/æ/ 音：cat, hat, map',
    description: '短元音 /æ/ 是英语最常见的元音之一。嘴巴张大，下巴下沉，发出短促的"啊"音，比中文"啊"时间更短、嘴角更向两侧拉开。',
    objectives: ['掌握短元音 /æ/ 的口型和发音', '识别 CVC（辅音-元音-辅音）单词结构', '流利朗读含 short a 的常用词'],
    sections: [
      {
        id: 'short_a_words',
        title: '短元音 a 单词 Short Vowel A',
        subtitle: '嘴巴大张，下巴下沉，发短促"啊"',
        items: [
          { letter: 'cat', ipa: '/kæt/', example: 'The cat is fat.', example_ipa: '/ðə kæt ɪz fæt/', example_zh: '这只猫很胖。', tip: '注意 a 发短促的/æ/，不是中文"啊"' },
          { letter: 'hat', ipa: '/hæt/', example: 'I have a hat.', example_ipa: '/aɪ hæv ə hæt/', example_zh: '我有一顶帽子。', tip: '嘴角向两侧拉开，快速收' },
          { letter: 'map', ipa: '/mæp/', example: 'Look at the map.', example_ipa: '/lʊk æt ðə mæp/', example_zh: '看地图。', tip: '/æ/ 比"啊"更靠前，在齿间位置' },
          { letter: 'bag', ipa: '/bæɡ/', example: 'Put it in the bag.', example_ipa: '/pʊt ɪt ɪn ðə bæɡ/', example_zh: '把它放进包里。', tip: '结尾 g 要发音，不要吞掉' },
          { letter: 'can', ipa: '/kæn/', example: 'I can do it.', example_ipa: '/aɪ kæn duː ɪt/', example_zh: '我能做到。', tip: '情态动词 can 弱读时发/kən/，强调时发/kæn/' },
          { letter: 'ran', ipa: '/ræn/', example: 'He ran fast.', example_ipa: '/hiː ræn fæst/', example_zh: '他跑得很快。', tip: 'ran 是 run 的过去式，注意元音变化' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: '注意 short a 的发音，嘴巴要张大！录音后 AI 会分析你的发音。',
      targets: [
        { text: 'cat, hat, map, bag, can, ran', zh: '短元音 a 单词', type: 'words' },
        { text: 'The fat cat sat on the mat.', zh: '胖猫坐在垫子上。', type: 'sentence' },
        { text: 'I can pack my bag and grab a hat.', zh: '我能把书包收好并拿上帽子。', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 3: 短元音 e /ɛ/ ───────────────────────────────────────
  {
    id: 'phonics_03',
    title: 'Lesson 3 — 短元音 e',
    subtitle: '/ɛ/ 音：bed, red, pen',
    description: '短元音 /ɛ/ 类似中文"诶"，但更短促。嘴巴半开，嘴角略向两侧，不像"啊"那么大。这是写单词时最容易混淆的元音之一。',
    objectives: ['掌握短元音 /ɛ/ 与 /æ/ 的区别', '识别常见含 short e 的单词', '能流利朗读简单句子'],
    sections: [
      {
        id: 'short_e_words',
        title: '短元音 e 单词 Short Vowel E',
        subtitle: '嘴半开，嘴角微张，发短"诶"',
        items: [
          { letter: 'bed', ipa: '/bɛd/', example: 'I sleep in my bed.', example_ipa: '/aɪ sliːp ɪn maɪ bɛd/', example_zh: '我在床上睡觉。', tip: '/ɛ/ 比 /æ/ 嘴更小，像说"诶"但快速收' },
          { letter: 'red', ipa: '/rɛd/', example: 'The apple is red.', example_ipa: '/ðə ˈæpl ɪz rɛd/', example_zh: '苹果是红的。', tip: '注意结尾 d 要发音' },
          { letter: 'pen', ipa: '/pɛn/', example: 'I need a pen.', example_ipa: '/aɪ niːd ə pɛn/', example_zh: '我需要一支笔。', tip: 'pen 和 pan 区分：pen=/ɛ/，pan=/æ/' },
          { letter: 'net', ipa: '/nɛt/', example: 'The fish net is big.', example_ipa: '/ðə fɪʃ nɛt ɪz bɪɡ/', example_zh: '渔网很大。', tip: '结尾 t 是清辅音，轻轻爆破即可' },
          { letter: 'leg', ipa: '/lɛɡ/', example: 'My leg hurts.', example_ipa: '/maɪ lɛɡ hɜːrts/', example_zh: '我的腿很疼。', tip: '/l/ 舌尖抵上齿龈，再发 /ɛ/' },
          { letter: 'ten', ipa: '/tɛn/', example: 'I have ten books.', example_ipa: '/aɪ hæv tɛn bʊks/', example_zh: '我有10本书。', tip: '数字 ten，与 tan(/æ/) 对比练习' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: '注意区分短元音 e /ɛ/ 和短元音 a /æ/，嘴巴开口大小不同！',
      targets: [
        { text: 'bed, red, pen, net, leg, ten', zh: '短元音 e 单词', type: 'words' },
        { text: 'The red hen has ten eggs in the nest.', zh: '红色的母鸡在巢里有10个蛋。', type: 'sentence' },
        { text: 'Ben left his pen on the desk.', zh: '本把他的笔留在了桌上。', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 4: 短元音 i /ɪ/ ───────────────────────────────────────
  {
    id: 'phonics_04',
    title: 'Lesson 4 — 短元音 i',
    subtitle: '/ɪ/ 音：big, sit, pin',
    description: '短元音 /ɪ/ 是英语中最高频的元音。发音类似"一"但更短、更放松，不要用力拉嘴角。中文母语者常把它发成长音 /iː/，这是最常见的错误之一。',
    objectives: ['区分短元音 /ɪ/ 和长元音 /iː/', '掌握含 short i 的高频词', '避免"短i变长i"的发音错误'],
    sections: [
      {
        id: 'short_i_words',
        title: '短元音 i 单词 Short Vowel I',
        subtitle: '放松的"一"，嘴角不用力拉',
        items: [
          { letter: 'big', ipa: '/bɪɡ/', example: 'That is a big dog.', example_ipa: '/ðæt ɪz ə bɪɡ dɒɡ/', example_zh: '那是一只大狗。', tip: '/ɪ/ 比"一"更放松，时间极短，不要拉长' },
          { letter: 'sit', ipa: '/sɪt/', example: 'Please sit down.', example_ipa: '/pliːz sɪt daʊn/', example_zh: '请坐下。', tip: '想象你快速说"色"，就接近 /sɪt/' },
          { letter: 'pin', ipa: '/pɪn/', example: 'Be careful of the pin.', example_ipa: '/biː ˈkɛrfəl əv ðə pɪn/', example_zh: '小心那根针。', tip: 'pin(/ɪ/) vs pen(/ɛ/) — 嘴型更高更紧' },
          { letter: 'fish', ipa: '/fɪʃ/', example: 'I like fish.', example_ipa: '/aɪ laɪk fɪʃ/', example_zh: '我喜欢鱼。', tip: 'sh 是二合字母，发"嘘"的音' },
          { letter: 'milk', ipa: '/mɪlk/', example: 'Drink your milk.', example_ipa: '/drɪŋk jɔːr mɪlk/', example_zh: '喝你的牛奶。', tip: 'lk 结尾辅音组合，两个都要发音' },
          { letter: 'this', ipa: '/ðɪs/', example: 'What is this?', example_ipa: '/wɒt ɪz ðɪs/', example_zh: '这是什么？', tip: 'th 是有声音，舌尖轻触牙齿，有振动' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: '注意 short i 要短促放松，不要把 fish 说成 feesh！',
      targets: [
        { text: 'big, sit, pin, fish, milk, this', zh: '短元音 i 单词', type: 'words' },
        { text: 'This big fish is in the dish.', zh: '这条大鱼在盘子里。', type: 'sentence' },
        { text: 'It is quick and it is pink.', zh: '它很快，并且是粉红色的。', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 5: 短元音 o /ɒ/ ───────────────────────────────────────
  {
    id: 'phonics_05',
    title: 'Lesson 5 — 短元音 o',
    subtitle: '/ɒ/ 音：hot, dog, pot',
    description: '短元音 /ɒ/（英式）或 /ɑː/（美式）是口腔最开、最放松的元音。发音时嘴巴大圆，嘴唇不要向前噘，像牙医让你说"啊"时的感觉。',
    objectives: ['掌握短元音 o 的口型', '识别常见含 short o 的单词', '区分 short o 和 short a 的口型差异'],
    sections: [
      {
        id: 'short_o_words',
        title: '短元音 o 单词 Short Vowel O',
        subtitle: '大圆口，嘴唇放松不噘',
        items: [
          { letter: 'hot', ipa: '/hɒt/', example: 'The soup is hot.', example_ipa: '/ðə suːp ɪz hɒt/', example_zh: '汤很烫。', tip: '嘴巴大圆，下巴放松，比 short a 更圆' },
          { letter: 'dog', ipa: '/dɒɡ/', example: 'The dog runs fast.', example_ipa: '/ðə dɒɡ rʌnz fæst/', example_zh: '狗跑得很快。', tip: '美式发音接近"达格"，口腔完全放开' },
          { letter: 'pot', ipa: '/pɒt/', example: 'The pot is on the stove.', example_ipa: '/ðə pɒt ɪz ɒn ðə stoʊv/', example_zh: '锅在炉子上。', tip: '注意 t 结尾要轻轻爆破' },
          { letter: 'box', ipa: '/bɒks/', example: 'Open the box.', example_ipa: '/ˈoʊpən ðə bɒks/', example_zh: '打开盒子。', tip: 'x 发/ks/，是两个音合在一起' },
          { letter: 'stop', ipa: '/stɒp/', example: 'Stop! Look and listen.', example_ipa: '/stɒp lʊk ənd ˈlɪsən/', example_zh: '停！看和听。', tip: 'st 是辅音组合，两个音都要发出来' },
          { letter: 'clock', ipa: '/klɒk/', example: 'What time is on the clock?', example_ipa: '/wɒt taɪm ɪz ɒn ðə klɒk/', example_zh: '时钟上几点了？', tip: 'cl 组合：/k/+/l/ 快速连读' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: '发 short o 时嘴要打开，像牙医检查口腔那样放松！',
      targets: [
        { text: 'hot, dog, pot, box, stop, clock', zh: '短元音 o 单词', type: 'words' },
        { text: 'The dog got on top of the box.', zh: '狗爬到了盒子上面。', type: 'sentence' },
        { text: 'Mom got a mop to clean the shop.', zh: '妈妈拿了拖把来打扫商店。', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 6: 短元音 u /ʌ/ ───────────────────────────────────────
  {
    id: 'phonics_06',
    title: 'Lesson 6 — 短元音 u',
    subtitle: '/ʌ/ 音：cup, run, fun',
    description: '短元音 /ʌ/ 是英语中非常常见但中文里没有的音。嘴巴半开，舌头平放，发出类似"啊"但更靠中间、更短促的音，中文里最接近"额"的一个快速版本。',
    objectives: ['掌握 /ʌ/ 这个中文里没有的元音', '识别含 short u 的高频词', '在句子中流利运用'],
    sections: [
      {
        id: 'short_u_words',
        title: '短元音 u 单词 Short Vowel U',
        subtitle: '嘴半开，舌平放，中间位置的短"啊"',
        items: [
          { letter: 'cup', ipa: '/kʌp/', example: 'Fill up my cup.', example_ipa: '/fɪl ʌp maɪ kʌp/', example_zh: '把我的杯子装满。', tip: '/ʌ/ 不是"啊"也不是"哦"，是中间位置，嘴半开' },
          { letter: 'run', ipa: '/rʌn/', example: 'Let\'s run to the park.', example_ipa: '/lɛts rʌn tuː ðə pɑːrk/', example_zh: '我们跑去公园吧。', tip: '想象在说"让"但把"让"的音调去掉' },
          { letter: 'fun', ipa: '/fʌn/', example: 'This game is fun.', example_ipa: '/ðɪs ɡeɪm ɪz fʌn/', example_zh: '这个游戏很好玩。', tip: '高频词，/ʌ/ 出现在很多最常用的英文词中' },
          { letter: 'bus', ipa: '/bʌs/', example: 'I take the bus.', example_ipa: '/aɪ teɪk ðə bʌs/', example_zh: '我坐公交车。', tip: '/ʌ/ 的发音关键是舌头保持平，不要弓起来' },
          { letter: 'sun', ipa: '/sʌn/', example: 'The sun is bright.', example_ipa: '/ðə sʌn ɪz braɪt/', example_zh: '太阳很耀眼。', tip: 'sun 和 son 同音（同形异义词）' },
          { letter: 'love', ipa: '/lʌv/', example: 'I love English.', example_ipa: '/aɪ lʌv ˈɪŋɡlɪʃ/', example_zh: '我爱英语。', tip: 'love 虽然有 o，但发/ʌ/，这是不规则拼写' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: '短元音 u 是中文里没有的音，多练习这些词，感受口腔中间位置的发音！',
      targets: [
        { text: 'cup, run, fun, bus, sun, love', zh: '短元音 u 单词', type: 'words' },
        { text: 'The pup runs under the sun.', zh: '小狗在太阳下跑步。', type: 'sentence' },
        { text: 'It\'s fun to run and jump in the mud.', zh: '在泥巴里跑跳很有趣。', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 7: 魔法E — 长元音 a /eɪ/ ────────────────────────────────
  {
    id: 'phonics_07',
    title: 'Lesson 7 — 魔法E：长元音 a',
    subtitle: '/eɪ/ 音：cake, name, late',
    description: '当单词末尾加上 e，中间的元音就变成"长音"（字母本身的读音）。a + 辅音 + e → 发/eɪ/，就是字母A的名称音。这个规则叫"魔法E"，是自然拼读最重要的规则之一。',
    objectives: ['理解"魔法E"规则：a_e发/eɪ/', '区分短元音 /æ/ 和长元音 /eɪ/的最小对（cap vs cape）', '掌握含 a_e 的常用单词'],
    sections: [
      {
        id: 'magic_e_a',
        title: '魔法E让 a 变长 Magic E + A',
        subtitle: 'a + 辅音 + e = /eɪ/',
        items: [
          { letter: 'cake', ipa: '/keɪk/', example: 'She made a cake.', example_ipa: '/ʃiː meɪd ə keɪk/', example_zh: '她做了一个蛋糕。', tip: '结尾的 e 不发音，但让 a 变成/eɪ/' },
          { letter: 'name', ipa: '/neɪm/', example: 'What is your name?', example_ipa: '/wɒt ɪz jɔːr neɪm/', example_zh: '你叫什么名字？', tip: '/eɪ/ 是双元音，从"欸"滑向"伊"' },
          { letter: 'late', ipa: '/leɪt/', example: 'Don\'t be late!', example_ipa: '/doʊnt biː leɪt/', example_zh: '不要迟到！', tip: '对比：hat /hæt/ vs hate /heɪt/，加 e 音变' },
          { letter: 'tape', ipa: '/teɪp/', example: 'I need some tape.', example_ipa: '/aɪ niːd sʌm teɪp/', example_zh: '我需要一些胶带。', tip: '对比：cap /kæp/ vs cape /keɪp/' },
          { letter: 'game', ipa: '/ɡeɪm/', example: 'Let\'s play a game.', example_ipa: '/lɛts pleɪ ə ɡeɪm/', example_zh: '我们来玩游戏吧。', tip: '/eɪ/ 中"伊"尾音轻轻带一下就好' },
          { letter: 'save', ipa: '/seɪv/', example: 'Save your work.', example_ipa: '/seɪv jɔːr wɜːrk/', example_zh: '保存你的工作。', tip: 'v 是有声摩擦音，上齿咬下唇要振动声带' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: '注意长元音 /eɪ/ 是双元音，先说"欸"再滑向"伊"！',
      targets: [
        { text: 'cake, name, late, tape, game, save', zh: '长元音 a 单词', type: 'words' },
        { text: 'hat — hate, cap — cape, tap — tape', zh: '短元音 vs 长元音对比', type: 'words' },
        { text: 'Jake came late to the baseball game.', zh: '杰克迟到了棒球比赛。', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 8: 魔法E — 长元音 i /aɪ/ ────────────────────────────────
  {
    id: 'phonics_08',
    title: 'Lesson 8 — 魔法E：长元音 i',
    subtitle: '/aɪ/ 音：bike, time, five',
    description: '魔法E规则应用在 i：i + 辅音 + e → 发/aɪ/，就是字母I的名称音，也是"爱"的音。这是一个双元音，从"啊"滑向"伊"。',
    objectives: ['掌握 i_e 的/aɪ/发音', '区分 short i /ɪ/ 和 long i /aɪ/（kit vs kite）', '在口语中自然运用'],
    sections: [
      {
        id: 'magic_e_i',
        title: '魔法E让 i 变长 Magic E + I',
        subtitle: 'i + 辅音 + e = /aɪ/',
        items: [
          { letter: 'bike', ipa: '/baɪk/', example: 'I ride my bike.', example_ipa: '/aɪ raɪd maɪ baɪk/', example_zh: '我骑自行车。', tip: '/aɪ/ 从"啊"的嘴型快速滑向"伊"，连成一个音' },
          { letter: 'time', ipa: '/taɪm/', example: 'What time is it?', example_ipa: '/wɒt taɪm ɪz ɪt/', example_zh: '现在几点了？', tip: '对比：Tim /tɪm/ vs time /taɪm/' },
          { letter: 'five', ipa: '/faɪv/', example: 'I have five cats.', example_ipa: '/aɪ hæv faɪv kæts/', example_zh: '我有五只猫。', tip: '数字 five，/aɪ/ 是这个词的核心音' },
          { letter: 'like', ipa: '/laɪk/', example: 'I like this song.', example_ipa: '/aɪ laɪk ðɪs sɒŋ/', example_zh: '我喜欢这首歌。', tip: '超高频词，/aɪ/ 要发完整，不能缩短' },
          { letter: 'ride', ipa: '/raɪd/', example: 'Let\'s ride the bus.', example_ipa: '/lɛts raɪd ðə bʌs/', example_zh: '我们坐公共汽车吧。', tip: '对比：rid /rɪd/ vs ride /raɪd/' },
          { letter: 'write', ipa: '/raɪt/', example: 'Write your name.', example_ipa: '/raɪt jɔːr neɪm/', example_zh: '写下你的名字。', tip: 'wr 中 w 不发音，就读/raɪt/' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: '/aɪ/ 是从"啊"流向"伊"的双元音，发音时嘴巴要有明显的滑动！',
      targets: [
        { text: 'bike, time, five, like, ride, write', zh: '长元音 i 单词', type: 'words' },
        { text: 'kit — kite, bit — bite, hid — hide', zh: '短元音 vs 长元音对比', type: 'words' },
        { text: 'Mike likes to ride his bike at nine.', zh: '迈克喜欢在9点骑自行车。', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 9: 魔法E — 长元音 o /oʊ/ ────────────────────────────────
  {
    id: 'phonics_09',
    title: 'Lesson 9 — 魔法E：长元音 o',
    subtitle: '/oʊ/ 音：hope, home, note',
    description: '魔法E规则应用在 o：o + 辅音 + e → 发/oʊ/，就是字母O的名称音。这是一个双元音，嘴先圆后向前收，从"哦"滑向"乌"。',
    objectives: ['掌握 o_e 的/oʊ/发音', '区分 short o /ɒ/ 和 long o /oʊ/（hop vs hope）', '读出含 o_e 的常见词汇'],
    sections: [
      {
        id: 'magic_e_o',
        title: '魔法E让 o 变长 Magic E + O',
        subtitle: 'o + 辅音 + e = /oʊ/',
        items: [
          { letter: 'hope', ipa: '/hoʊp/', example: 'I hope you feel better.', example_ipa: '/aɪ hoʊp juː fiːl ˈbɛtər/', example_zh: '我希望你好起来。', tip: '对比：hop /hɒp/ vs hope /hoʊp/ — 加e音变长' },
          { letter: 'home', ipa: '/hoʊm/', example: 'I\'m going home.', example_ipa: '/aɪm ˈɡoʊɪŋ hoʊm/', example_zh: '我要回家了。', tip: '/oʊ/ 从圆嘴"哦"快速滑向撅嘴"乌"' },
          { letter: 'note', ipa: '/noʊt/', example: 'Take a note.', example_ipa: '/teɪk ə noʊt/', example_zh: '记笔记。', tip: '对比：not /nɒt/ vs note /noʊt/' },
          { letter: 'bone', ipa: '/boʊn/', example: 'The dog has a bone.', example_ipa: '/ðə dɒɡ hæz ə boʊn/', example_zh: '狗有一根骨头。', tip: '/oʊ/ 是美式英语特有的双元音' },
          { letter: 'code', ipa: '/koʊd/', example: 'Can you write code?', example_ipa: '/kæn juː raɪt koʊd/', example_zh: '你会写代码吗？', tip: '编程人的超高频词，code = 代码，/koʊd/' },
          { letter: 'stone', ipa: '/stoʊn/', example: 'Don\'t throw stones.', example_ipa: '/doʊnt θroʊ stoʊnz/', example_zh: '不要扔石头。', tip: 'st 组合 + /oʊn/ — 辅音组合后跟长元音' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: '/oʊ/ 是双元音，嘴从圆形"哦"滑向撅起"乌"，记住这个嘴型运动！',
      targets: [
        { text: 'hope, home, note, bone, code, stone', zh: '长元音 o 单词', type: 'words' },
        { text: 'hop — hope, not — note, cod — code', zh: '短元音 vs 长元音对比', type: 'words' },
        { text: 'Joe drove home alone on the road.', zh: '乔独自开车回家。', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 10: 魔法E — 长元音 u /juː/ ───────────────────────────────
  {
    id: 'phonics_10',
    title: 'Lesson 10 — 魔法E：长元音 u',
    subtitle: '/juː/ 音：cute, tube, June',
    description: '魔法E规则应用在 u：u + 辅音 + e → 发/juː/（或/uː/），就是字母U的名称音。这个音类似中文"于"或"乌"，多数情况在辅音后发/juː/。',
    objectives: ['掌握 u_e 的/juː/和/uː/发音', '理解什么时候发/juː/什么时候发/uː/', '识别含 u_e 的常用词'],
    sections: [
      {
        id: 'magic_e_u',
        title: '魔法E让 u 变长 Magic E + U',
        subtitle: 'u + 辅音 + e = /juː/ 或 /uː/',
        items: [
          { letter: 'cute', ipa: '/kjuːt/', example: 'The puppy is cute.', example_ipa: '/ðə ˈpʌpi ɪz kjuːt/', example_zh: '这只小狗很可爱。', tip: '/kjuːt/ — c+/juː/，嘴撅起说"Q-T"' },
          { letter: 'tube', ipa: '/tjuːb/', example: 'YouTube is a video tube.', example_ipa: '/ˈjuːtjuːb ɪz ə ˈvɪdioʊ tjuːb/', example_zh: 'YouTube 是视频网站。', tip: 'tube 就是 YouTube 的 tube，意思是管子' },
          { letter: 'June', ipa: '/dʒuːn/', example: 'Summer starts in June.', example_ipa: '/ˈsʌmər stɑːrts ɪn dʒuːn/', example_zh: '夏天从六月开始。', tip: '六月份，J 发/dʒ/音，像中文"纠"' },
          { letter: 'mule', ipa: '/mjuːl/', example: 'A mule is stubborn.', example_ipa: '/ə mjuːl ɪz ˈstʌbərn/', example_zh: '骡子很固执。', tip: '/mjuːl/ — m + /juː/ + l' },
          { letter: 'use', ipa: '/juːz/', example: 'How do you use this?', example_ipa: '/haʊ duː juː juːz ðɪs/', example_zh: '你怎么使用这个？', tip: '动词 use 发/juːz/，名词 use 发/juːs/' },
          { letter: 'flute', ipa: '/fluːt/', example: 'She plays the flute.', example_ipa: '/ʃiː pleɪz ðə fluːt/', example_zh: '她吹长笛。', tip: 'fl 辅音组合，/l/ 后跟 u_e → /uː/ 而非 /juː/' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: '长元音 u 嘴唇向前撅，像说"于"或"乌"，保持圆唇！',
      targets: [
        { text: 'cute, tube, June, mule, use, flute', zh: '长元音 u 单词', type: 'words' },
        { text: 'cub — cube, cut — cute, tub — tube', zh: '短元音 vs 长元音对比', type: 'words' },
        { text: 'Luke used a huge tube of glue in June.', zh: '卢克在六月用了一大管胶水。', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 11: 辅音连缀 L组合 ───────────────────────────────────────
  {
    id: 'phonics_11',
    title: 'Lesson 11 — 辅音连缀（L组合）',
    subtitle: 'bl / cl / fl / gl / pl / sl',
    description: '两个辅音并排出现叫"辅音连缀"（consonant blends）。L组合是第一个辅音后紧跟 L，两个音都要清晰发出，不能省略其中一个，也不能在中间加元音。',
    objectives: ['两个辅音都要发音，不要省略', '感受辅音连缀的滑动感', '读出含L组合的常用词'],
    sections: [
      {
        id: 'l_blends',
        title: 'L 辅音连缀 L-Blends',
        subtitle: '每个辅音都发音，快速连读',
        items: [
          { letter: 'bl', ipa: '/bl/', example: 'blue, black, blow', example_ipa: '/bluː/, /blæk/, /bloʊ/', example_zh: '蓝色，黑色，吹', tip: '/b/ 后立刻接 /l/，不加任何元音在中间' },
          { letter: 'cl', ipa: '/kl/', example: 'class, clean, click', example_ipa: '/klæs/, /kliːn/, /klɪk/', example_zh: '班级，干净，点击', tip: '/k/ 后接 /l/，常见于 click, clock, cloud' },
          { letter: 'fl', ipa: '/fl/', example: 'flag, fly, flower', example_ipa: '/flæɡ/, /flaɪ/, /ˈflaʊər/', example_zh: '旗帜，飞，花', tip: '上齿咬下唇发/f/，立刻接/l/，舌头弹起' },
          { letter: 'gl', ipa: '/ɡl/', example: 'glass, glad, glow', example_ipa: '/ɡlæs/, /ɡlæd/, /ɡloʊ/', example_zh: '玻璃，高兴，发光', tip: '喉咙爆破/g/后即接/l/，听起来有滑溜感' },
          { letter: 'pl', ipa: '/pl/', example: 'play, plan, please', example_ipa: '/pleɪ/, /plæn/, /pliːz/', example_zh: '玩耍，计划，请', tip: 'please 是超高频礼貌用语，pl + ease' },
          { letter: 'sl', ipa: '/sl/', example: 'sleep, slow, slim', example_ipa: '/sliːp/, /sloʊ/, /slɪm/', example_zh: '睡觉，慢，苗条', tip: '牙关微开发/s/，立即接/l/，注意先后顺序' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: '辅音连缀两个音都要发出来，不要在中间加入任何元音！',
      targets: [
        { text: 'blue, class, flag, glass, play, sleep', zh: 'L组合单词', type: 'words' },
        { text: 'Please clean the floor and the glass.', zh: '请打扫地板和玻璃。', type: 'sentence' },
        { text: 'The black flower blooms slowly.', zh: '黑色的花慢慢开放。', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 12: 辅音连缀 R组合 ───────────────────────────────────────
  {
    id: 'phonics_12',
    title: 'Lesson 12 — 辅音连缀（R组合）',
    subtitle: 'br / cr / dr / fr / gr / pr / tr',
    description: 'R组合是最常见的辅音连缀，辅音后接R音（舌头卷起）。中文母语者常常在辅音后面加"额"音，要特别注意直接滑向R，不加任何中间音。',
    objectives: ['掌握R的卷舌动作', '不在辅音和R之间加元音', '流利读出含R组合的词'],
    sections: [
      {
        id: 'r_blends',
        title: 'R 辅音连缀 R-Blends',
        subtitle: '舌头卷起，辅音直接滑向R',
        items: [
          { letter: 'br', ipa: '/br/', example: 'break, bring, brown', example_ipa: '/breɪk/, /brɪŋ/, /braʊn/', example_zh: '打破，带来，棕色', tip: '双唇爆破/b/，立刻舌头卷起/r/，不加"额"' },
          { letter: 'cr', ipa: '/kr/', example: 'cross, cry, create', example_ipa: '/krɒs/, /kraɪ/, /kriːˈeɪt/', example_zh: '穿过，哭，创造', tip: '/k/ 是爆破音，配合卷舌/r/快速连读' },
          { letter: 'dr', ipa: '/dr/', example: 'drive, dream, drink', example_ipa: '/draɪv/, /driːm/, /drɪŋk/', example_zh: '驾驶，梦，喝', tip: '/dr/ 连在一起像中文"哒R"，舌头抬起' },
          { letter: 'fr', ipa: '/fr/', example: 'free, friend, from', example_ipa: '/friː/, /frɛnd/, /frɒm/', example_zh: '自由，朋友，从', tip: '上齿咬下唇/f/后卷舌/r/，高频词 from, free' },
          { letter: 'gr', ipa: '/ɡr/', example: 'great, grow, green', example_ipa: '/ɡreɪt/, /ɡroʊ/, /ɡriːn/', example_zh: '伟大，成长，绿色', tip: '喉咙/g/ + 卷舌/r/，great 是常用感叹词' },
          { letter: 'pr', ipa: '/pr/', example: 'print, program, price', example_ipa: '/prɪnt/, /ˈproʊɡræm/, /praɪs/', example_zh: '打印，程序，价格', tip: 'program 是编程必备词！/ˈproʊɡræm/' },
          { letter: 'tr', ipa: '/tr/', example: 'try, tree, train', example_ipa: '/traɪ/, /triː/, /treɪn/', example_zh: '尝试，树，火车', tip: '/tr/ 像中文"测R"快速连读，舌尖先抵上颚' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: 'R组合里的R一定要卷舌，辅音直接滑过去，不能加额外的元音！',
      targets: [
        { text: 'break, cross, drive, free, great, print, try', zh: 'R组合单词', type: 'words' },
        { text: 'Try to write a great program from scratch.', zh: '试着从零写一个很棒的程序。', type: 'sentence' },
        { text: 'My friend drove the truck across the bridge.', zh: '我朋友开卡车穿过了桥。', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 13: 辅音连缀 S开头 ───────────────────────────────────────
  {
    id: 'phonics_13',
    title: 'Lesson 13 — 辅音连缀（S开头）',
    subtitle: 'sc / sk / sm / sn / sp / st / sw',
    description: 'S 可以与多个辅音组合形成连缀。S开头的连缀是英语中最常见的词开头方式之一，包含了大量高频词汇。',
    objectives: ['掌握S开头的7种辅音组合', '不在S和后续辅音之间加元音', '流利识读含S连缀的高频词'],
    sections: [
      {
        id: 's_blends',
        title: 'S 辅音连缀 S-Blends',
        subtitle: 'S + 辅音，两音快速连读',
        items: [
          { letter: 'sc', ipa: '/sk/', example: 'scare, score, screen', example_ipa: '/skɛr/, /skɔːr/, /skriːn/', example_zh: '吓到，得分，屏幕', tip: 'sc 在 a/o/u 前发/sk/，screen = 屏幕！编程常用词' },
          { letter: 'sk', ipa: '/sk/', example: 'skip, skill, sky', example_ipa: '/skɪp/, /skɪl/, /skaɪ/', example_zh: '跳过，技能，天空', tip: 'skill 是编程/职场超高频词，/skɪl/' },
          { letter: 'sm', ipa: '/sm/', example: 'smile, small, smart', example_ipa: '/smaɪl/, /smɔːl/, /smɑːrt/', example_zh: '微笑，小，聪明', tip: 'smart 是常见褒义词，/smɑːrt/' },
          { letter: 'sn', ipa: '/sn/', example: 'snow, snap, snack', example_ipa: '/snoʊ/, /snæp/, /snæk/', example_zh: '雪，拍照/点击，零食', tip: 'snap 现在也有"拍照"的含义，很现代' },
          { letter: 'sp', ipa: '/sp/', example: 'speak, speed, space', example_ipa: '/spiːk/, /spiːd/, /speɪs/', example_zh: '说话，速度，空间', tip: 'speak, speed, space 全是s+p高频词' },
          { letter: 'st', ipa: '/st/', example: 'start, step, store', example_ipa: '/stɑːrt/, /stɛp/, /stɔːr/', example_zh: '开始，步骤，商店', tip: 'start, step — 编程和职场核心词汇' },
          { letter: 'sw', ipa: '/sw/', example: 'swim, sweet, switch', example_ipa: '/swɪm/, /swiːt/, /swɪtʃ/', example_zh: '游泳，甜，开关', tip: 'switch 是编程 switch 语句！/swɪtʃ/' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: 'S开头的组合很多都是编程/科技词汇，练好这些对你有实际用处！',
      targets: [
        { text: 'screen, skill, smart, snap, speak, start, switch', zh: 'S组合单词', type: 'words' },
        { text: 'Start the program and check the screen.', zh: '启动程序并检查屏幕。', type: 'sentence' },
        { text: 'She speaks with skill and smart style.', zh: '她说话既有技巧又聪明。', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 14: 尾部辅音连缀 ─────────────────────────────────────────
  {
    id: 'phonics_14',
    title: 'Lesson 14 — 尾部辅音连缀',
    subtitle: 'nd / nt / nk / mp / st',
    description: '单词结尾也可以有辅音连缀。中文音节几乎都以元音结尾，所以中文母语者常常吞掉英文的结尾辅音。尾部辅音连缀需要把两个辅音都发出来，这对英文清晰度至关重要。',
    objectives: ['不吞掉单词结尾的辅音', '清晰发出两个结尾辅音', '掌握含尾部连缀的高频词'],
    sections: [
      {
        id: 'end_blends',
        title: '尾部辅音连缀 End Blends',
        subtitle: '两个结尾辅音都要发出来',
        items: [
          { letter: 'nd', ipa: '/nd/', example: 'hand, friend, send', example_ipa: '/hænd/, /frɛnd/, /sɛnd/', example_zh: '手，朋友，发送', tip: '/nd/ — 舌尖抵上，然后轻爆破d，都要发' },
          { letter: 'nt', ipa: '/nt/', example: 'want, front, point', example_ipa: '/wɒnt/, /frʌnt/, /pɔɪnt/', example_zh: '想要，前面，指出', tip: 'point = 指出/要点，编程和演讲都用' },
          { letter: 'nk', ipa: '/ŋk/', example: 'think, link, blank', example_ipa: '/θɪŋk/, /lɪŋk/, /blæŋk/', example_zh: '思考，链接，空白', tip: 'link, blank 是 HTML/编程超高频词！' },
          { letter: 'mp', ipa: '/mp/', example: 'jump, lamp, stamp', example_ipa: '/dʒʌmp/, /læmp/, /stæmp/', example_zh: '跳，灯，邮票', tip: '/m/ 双唇合拢后/p/ 再次爆破，两个动作连续' },
          { letter: 'st', ipa: '/st/', example: 'best, test, list', example_ipa: '/bɛst/, /tɛst/, /lɪst/', example_zh: '最好，测试，列表', tip: 'list, test 在编程中极常见！结尾/st/清晰发出' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: '结尾辅音组合最容易被吞掉！每个单词结尾都要发完整！',
      targets: [
        { text: 'hand, friend, want, think, link, jump, list', zh: '尾部连缀单词', type: 'words' },
        { text: 'Send the link and point to the blank line.', zh: '发送链接并指向空白行。', type: 'sentence' },
        { text: 'Think of the best test for this function.', zh: '想想这个函数最好的测试方案。', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 15: 二合字母 ch/sh/th/wh ─────────────────────────────────
  {
    id: 'phonics_15',
    title: 'Lesson 15 — 辅音二合字母',
    subtitle: 'ch / sh / th / wh — 两字母一个音',
    description: '二合字母（digraphs）是两个字母组合成一个全新的音，不是两个字母各自发音的叠加。这是自然拼读中最重要的规则之一，涵盖了大量高频词汇。',
    objectives: ['理解二合字母≠两个字母分开发音', '掌握 ch/sh/th/wh 的正确发音', '区分有声 th /ð/ 和无声 th /θ/'],
    sections: [
      {
        id: 'digraphs',
        title: '辅音二合字母 Consonant Digraphs',
        subtitle: '两字母合成一个新音',
        items: [
          { letter: 'ch', ipa: '/tʃ/', example: 'chair, check, much', example_ipa: '/tʃɛr/, /tʃɛk/, /mʌtʃ/', example_zh: '椅子，检查，很多', tip: '先舌尖抵上颚/t/，再发"嘘"/ʃ/，快速连成/tʃ/' },
          { letter: 'sh', ipa: '/ʃ/', example: 'she, shop, push', example_ipa: '/ʃiː/, /ʃɒp/, /pʊʃ/', example_zh: '她，商店，推', tip: '嘴唇向前噘，发"嘘"的音，像让别人安静' },
          { letter: 'th', ipa: '/θ/ or /ð/', example: 'think vs this', example_ipa: '/θɪŋk/ vs /ðɪs/', example_zh: '思考 vs 这个', tip: '舌尖轻触上齿；think/θ/无声，this/ð/有声振动' },
          { letter: 'wh', ipa: '/w/', example: 'what, when, where', example_ipa: '/wɒt/, /wɛn/, /wɛr/', example_zh: '什么，什么时候，哪里', tip: '美式英语中 wh 通常只发/w/音，h 不发音' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: 'th 是中文里完全没有的音，一定要舌尖碰到上齿！',
      targets: [
        { text: 'chair, shop, think, this, what, when, where', zh: '二合字母单词', type: 'words' },
        { text: 'She thinks this chair is much better.', zh: '她认为这把椅子好多了。', type: 'sentence' },
        { text: 'What shop sells the cheapest things?', zh: '哪家商店卖的东西最便宜？', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 16: 元音二合 ai/ay /eɪ/ ─────────────────────────────────
  {
    id: 'phonics_16',
    title: 'Lesson 16 — 元音二合字母 ai / ay',
    subtitle: '/eɪ/ 音：rain, play, wait',
    description: 'ai 和 ay 都发/eɪ/音（与字母A的名称音相同）。规律：ai 通常在词中（rain, mail），ay 通常在词尾（play, day, way）。',
    objectives: ['ai 和 ay 都发 /eɪ/', '记住 ai 在词中、ay 在词尾的位置规律', '识读含 ai/ay 的高频词'],
    sections: [
      {
        id: 'ai_ay',
        title: 'ai 和 ay 元音二合 AI / AY',
        subtitle: 'ai 词中，ay 词尾，都发 /eɪ/',
        items: [
          { letter: 'ai', ipa: '/eɪ/', example: 'rain, mail, train', example_ipa: '/reɪn/, /meɪl/, /treɪn/', example_zh: '雨，邮件，火车', tip: 'ai 在词的中间，rain 和 email 中的 ai' },
          { letter: 'ay', ipa: '/eɪ/', example: 'day, play, say', example_ipa: '/deɪ/, /pleɪ/, /seɪ/', example_zh: '天，玩，说', tip: 'ay 在词的末尾，today, okay, birthday' },
          { letter: 'wait', ipa: '/weɪt/', example: 'Please wait here.', example_ipa: '/pliːz weɪt hɪr/', example_zh: '请在这里等候。', tip: 'wait, bait, tail — ai 组合高频词' },
          { letter: 'say', ipa: '/seɪ/', example: 'What did you say?', example_ipa: '/wɒt dɪd juː seɪ/', example_zh: '你说什么了？', tip: 'say, pay, day, may, way — ay 家族' },
          { letter: 'email', ipa: '/ˈiːmeɪl/', example: 'Send me an email.', example_ipa: '/sɛnd miː æn ˈiːmeɪl/', example_zh: '给我发邮件。', tip: 'e-mail 中的 mail 包含 ai 的/eɪ/音' },
          { letter: 'today', ipa: '/təˈdeɪ/', example: 'What is today\'s date?', example_ipa: '/wɒt ɪz təˈdeɪz deɪt/', example_zh: '今天是几号？', tip: 'today = to + day，结尾 ay 重读' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: 'ai 和 ay 都是 /eɪ/，注意 ai 在词中而 ay 在词尾这个规律！',
      targets: [
        { text: 'rain, mail, day, play, wait, say, today', zh: 'ai/ay 单词', type: 'words' },
        { text: 'It may rain today, so stay inside.', zh: '今天可能会下雨，所以待在室内。', type: 'sentence' },
        { text: 'Wait for me, I\'ll be on my way.', zh: '等等我，我就来了。', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 17: 元音二合 ea/ee /iː/ ──────────────────────────────────
  {
    id: 'phonics_17',
    title: 'Lesson 17 — 元音二合字母 ea / ee',
    subtitle: '/iː/ 音：eat, see, team',
    description: 'ea 和 ee 多数情况下都发/iː/（长元音E）。这是英语最常见的两个"长E"拼写方式，包含了大量最常用的英文单词。',
    objectives: ['ea 和 ee 主要发 /iː/（注意 ea 有例外）', '识读含 ea/ee 的高频词', '区分常见的 ea 例外：head, bread 发 /ɛ/'],
    sections: [
      {
        id: 'ea_ee',
        title: 'ea 和 ee 元音二合 EA / EE',
        subtitle: '多数情况发 /iː/，嘴角拉宽微笑',
        items: [
          { letter: 'ee', ipa: '/iː/', example: 'see, tree, sleep', example_ipa: '/siː/, /triː/, /sliːp/', example_zh: '看见，树，睡觉', tip: 'ee 几乎总是/iː/，嘴角向两侧大拉，微笑状' },
          { letter: 'ea', ipa: '/iː/', example: 'eat, team, read', example_ipa: '/iːt/, /tiːm/, /riːd/', example_zh: '吃，团队，读', tip: 'ea 通常也是/iː/，但 bread, head 例外发/ɛ/' },
          { letter: 'team', ipa: '/tiːm/', example: 'We are a team.', example_ipa: '/wiː ɑːr ə tiːm/', example_zh: '我们是一个团队。', tip: 'team 在职场是超高频词！ea = /iː/' },
          { letter: 'read', ipa: '/riːd/', example: 'Read the README file.', example_ipa: '/riːd ðə ˈriːdmiː faɪl/', example_zh: '阅读 README 文件。', tip: '注意：read(现在时)/riːd/ vs read(过去时)/rɛd/' },
          { letter: 'week', ipa: '/wiːk/', example: 'See you next week!', example_ipa: '/siː juː nɛkst wiːk/', example_zh: '下周见！', tip: 'week, weekend — ee 家族高频词' },
          { letter: 'meet', ipa: '/miːt/', example: 'Nice to meet you.', example_ipa: '/naɪs tuː miːt juː/', example_zh: '很高兴认识你。', tip: '见面问候必用词，ee = /iː/' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: '/iː/ 是英语最长最清晰的元音，嘴角大力向两侧拉！',
      targets: [
        { text: 'see, tree, eat, team, read, week, meet', zh: 'ea/ee 单词', type: 'words' },
        { text: 'Nice to meet you! Please have a seat.', zh: '很高兴认识你！请坐。', type: 'sentence' },
        { text: 'The team needs to read the emails each week.', zh: '团队每周需要阅读邮件。', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 18: 元音二合 oa/ow /oʊ/ ─────────────────────────────────
  {
    id: 'phonics_18',
    title: 'Lesson 18 — 元音二合字母 oa / ow',
    subtitle: '/oʊ/ 音：boat, know, show',
    description: 'oa 和 ow（部分情况）都发长元音/oʊ/。oa 通常在词中（coat, road），ow 在词尾时常发/oʊ/（snow, know），但在词中 ow 也可能发/aʊ/（cow, how）——这是重要的区别。',
    objectives: ['oa 总是发/oʊ/，ow 在词尾发/oʊ/', '注意 ow 的两种发音：/oʊ/ vs /aʊ/', '识读含 oa/ow 的常用词'],
    sections: [
      {
        id: 'oa_ow',
        title: 'oa 和 ow 元音二合 OA / OW',
        subtitle: 'oa → /oʊ/；ow 词尾 → /oʊ/，词中 → /aʊ/',
        items: [
          { letter: 'oa', ipa: '/oʊ/', example: 'boat, coat, road', example_ipa: '/boʊt/, /koʊt/, /roʊd/', example_zh: '船，外套，道路', tip: 'oa 几乎总是/oʊ/，嘴从圆"哦"滑向"乌"' },
          { letter: 'ow→/oʊ/', ipa: '/oʊ/', example: 'snow, know, show', example_ipa: '/snoʊ/, /noʊ/, /ʃoʊ/', example_zh: '雪，知道，展示', tip: 'ow 在词尾发/oʊ/：show, grow, flow, blow' },
          { letter: 'ow→/aʊ/', ipa: '/aʊ/', example: 'cow, how, now', example_ipa: '/kaʊ/, /haʊ/, /naʊ/', example_zh: '牛，怎么，现在', tip: 'ow 在词中常发/aʊ/：cow, power, download' },
          { letter: 'know', ipa: '/noʊ/', example: 'I don\'t know.', example_ipa: '/aɪ doʊnt noʊ/', example_zh: '我不知道。', tip: 'know 中 k 不发音，就是/noʊ/' },
          { letter: 'show', ipa: '/ʃoʊ/', example: 'Show me the code.', example_ipa: '/ʃoʊ miː ðə koʊd/', example_zh: '给我看代码。', tip: 'show 是编程/工作中的高频词，/ʃoʊ/' },
          { letter: 'download', ipa: '/ˈdaʊnloʊd/', example: 'Download the app.', example_ipa: '/ˈdaʊnloʊd ðə æp/', example_zh: '下载这个应用。', tip: 'down=/daʊn/（/aʊ/），load=/loʊd/（/oʊ/）' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: '注意 ow 的两种读法：词尾是/oʊ/，词中多是/aʊ/，如 download 两个都有！',
      targets: [
        { text: 'boat, road, snow, know, show, cow, download', zh: 'oa/ow 单词', type: 'words' },
        { text: 'I know how to show you the road on the boat.', zh: '我知道怎么在船上给你指路。', type: 'sentence' },
        { text: 'Download the app and follow the flow.', zh: '下载这个应用然后跟着流程走。', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 19: 特殊元音 oo ───────────────────────────────────────────
  {
    id: 'phonics_19',
    title: 'Lesson 19 — 特殊元音 oo',
    subtitle: '/uː/ 和 /ʊ/ — moon vs book',
    description: 'oo 有两种读法：长音/uː/（像"乌"，嘴唇向前噘）和短音/ʊ/（像放松版的"乌"，嘴唇不那么噘）。两种音出现在不同的词里，需要分开记忆。',
    objectives: ['区分长音 oo /uː/ 和短音 oo /ʊ/', '识别哪些词是长音哪些是短音', '掌握含 oo 的高频词'],
    sections: [
      {
        id: 'oo_long',
        title: 'oo 长音 /uː/ — 嘴唇向前噘',
        subtitle: 'moon, food, school, cool',
        items: [
          { letter: 'moon', ipa: '/muːn/', example: 'The moon is full tonight.', example_ipa: '/ðə muːn ɪz fʊl təˈnaɪt/', example_zh: '今晚月圆。', tip: '/uː/ 嘴唇向前噘起，像在说"乌"，持续时间长' },
          { letter: 'food', ipa: '/fuːd/', example: 'I love spicy food.', example_ipa: '/aɪ lʌv ˈspaɪsi fuːd/', example_zh: '我喜欢辣食物。', tip: 'food, mood, cool — 长音 oo 家族' },
          { letter: 'school', ipa: '/skuːl/', example: 'I go to school by bus.', example_ipa: '/aɪ ɡoʊ tuː skuːl baɪ bʌs/', example_zh: '我坐公交去学校。', tip: 'school 的 ch 不发/tʃ/，发/k/！是例外' },
          { letter: 'tool', ipa: '/tuːl/', example: 'This is a useful tool.', example_ipa: '/ðɪs ɪz ə ˈjuːsfəl tuːl/', example_zh: '这是个有用的工具。', tip: 'tool 在编程中超常用，/tuːl/' },
        ],
      },
      {
        id: 'oo_short',
        title: 'oo 短音 /ʊ/ — 嘴唇放松',
        subtitle: 'book, look, good, cook',
        items: [
          { letter: 'book', ipa: '/bʊk/', example: 'Read a book every day.', example_ipa: '/riːd ə bʊk ˈɛvri deɪ/', example_zh: '每天读一本书。', tip: '/ʊ/ 嘴唇稍圆但不向前噘，比/uː/更放松更短' },
          { letter: 'look', ipa: '/lʊk/', example: 'Look at this!', example_ipa: '/lʊk æt ðɪs/', example_zh: '看这个！', tip: 'look, cook, hook, took — 短音 oo 家族' },
          { letter: 'good', ipa: '/ɡʊd/', example: 'Good job!', example_ipa: '/ɡʊd dʒɒb/', example_zh: '做得好！', tip: '超高频表扬词！注意是/ɡʊd/不是/ɡuːd/' },
          { letter: 'foot', ipa: '/fʊt/', example: 'I hurt my foot.', example_ipa: '/aɪ hɜːrt maɪ fʊt/', example_zh: '我的脚受伤了。', tip: 'foot, wood, stood — 短音/ʊ/家族' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: '区分长音 /uː/ (moon) 和短音 /ʊ/ (book) — 嘴唇噘起程度不同！',
      targets: [
        { text: 'moon, food, tool, book, look, good', zh: 'oo 长音和短音', type: 'words' },
        { text: 'moon — book, food — foot, cool — cook', zh: '长音 vs 短音对比', type: 'words' },
        { text: 'Good! Look at this useful tool for school.', zh: '很好！看看这个学校的实用工具。', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 20: R控元音 ──────────────────────────────────────────────
  {
    id: 'phonics_20',
    title: 'Lesson 20 — R控制元音',
    subtitle: 'ar / er / ir / or / ur',
    description: '当元音后面跟着 R，元音的发音会被改变，称为"R控制元音"。这是美式英语的一大特色——R的卷舌音会"拉着"前面的元音一起改变，形成独特的音色。',
    objectives: ['理解 R 改变前面元音发音的规律', '掌握 ar/er/ir/or/ur 各自的发音', '区分 er/ir/ur 三个相同的/ɜːr/音'],
    sections: [
      {
        id: 'r_controlled',
        title: 'R 控制元音 R-Controlled Vowels',
        subtitle: 'ar=/ɑːr/, er/ir/ur=/ɜːr/, or=/ɔːr/',
        items: [
          { letter: 'ar', ipa: '/ɑːr/', example: 'car, star, hard', example_ipa: '/kɑːr/, /stɑːr/, /hɑːrd/', example_zh: '汽车，星星，困难', tip: '/ɑːr/ — 嘴大张"啊"然后舌头后卷，像一个动作' },
          { letter: 'er', ipa: '/ɜːr/', example: 'her, teacher, water', example_ipa: '/hɜːr/, /ˈtiːtʃər/, /ˈwɔːtər/', example_zh: '她，老师，水', tip: '/ɜːr/ — 嘴半开，舌头向后卷，英语中最常见的弱化音' },
          { letter: 'ir', ipa: '/ɜːr/', example: 'bird, girl, first', example_ipa: '/bɜːrd/, /ɡɜːrl/, /fɜːrst/', example_zh: '鸟，女孩，第一', tip: 'ir 和 er 发音完全相同！都是/ɜːr/' },
          { letter: 'or', ipa: '/ɔːr/', example: 'for, more, store', example_ipa: '/fɔːr/, /mɔːr/, /stɔːr/', example_zh: '为了，更多，商店', tip: '/ɔːr/ — 嘴圆，"哦"和卷舌合在一起' },
          { letter: 'ur', ipa: '/ɜːr/', example: 'turn, burn, hurt', example_ipa: '/tɜːrn/, /bɜːrn/, /hɜːrt/', example_zh: '转，燃烧，伤害', tip: 'ur/ir/er 发音相同，都是/ɜːr/，不同拼写而已' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: 'R控制元音中R的卷舌是重点，从元音开始就要准备好卷舌！',
      targets: [
        { text: 'car, star, her, bird, girl, for, store, turn', zh: 'R控元音单词', type: 'words' },
        { text: 'The first girl turned her car toward the store.', zh: '第一个女孩把她的车转向商店。', type: 'sentence' },
        { text: 'Her teacher works harder for better work.', zh: '她的老师工作更加努力以获得更好的成果。', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 21: 双元音 ou/ow/oi/oy ───────────────────────────────────
  {
    id: 'phonics_21',
    title: 'Lesson 21 — 双元音',
    subtitle: 'ou/ow /aʊ/ 和 oi/oy /ɔɪ/',
    description: '双元音（diphthongs）是两个元音音色连续滑动的复合音。ou/ow 发/aʊ/（从"啊"滑向"乌"），oi/oy 发/ɔɪ/（从"哦"滑向"伊"）。这两组音中文里都没有，需要特别练习。',
    objectives: ['掌握 ou/ow=/aʊ/ 的滑动发音', '掌握 oi/oy=/ɔɪ/ 的滑动发音', '与上节课 ow=/oʊ/ 区分（snow vs cow）'],
    sections: [
      {
        id: 'ou_ow',
        title: 'ou 和 ow → /aʊ/ 从"啊"滑向"乌"',
        subtitle: 'out, house, cow, how',
        items: [
          { letter: 'ou', ipa: '/aʊ/', example: 'out, house, loud', example_ipa: '/aʊt/, /haʊs/, /laʊd/', example_zh: '出去，房子，大声', tip: '嘴从大张"啊"快速滑向圆唇"乌"，一个连贯动作' },
          { letter: 'ow', ipa: '/aʊ/', example: 'cow, how, crowd', example_ipa: '/kaʊ/, /haʊ/, /kraʊd/', example_zh: '牛，怎么，人群', tip: 'ow 在词中发/aʊ/（cow），词尾发/oʊ/（snow）' },
          { letter: 'download', ipa: '/ˈdaʊnloʊd/', example: 'Click to download.', example_ipa: '/klɪk tuː ˈdaʊnloʊd/', example_zh: '点击下载。', tip: '一个词里两种 ow：down=/aʊ/，load=/oʊ/' },
        ],
      },
      {
        id: 'oi_oy',
        title: 'oi 和 oy → /ɔɪ/ 从"哦"滑向"伊"',
        subtitle: 'oil, boy, enjoy',
        items: [
          { letter: 'oi', ipa: '/ɔɪ/', example: 'oil, coin, voice', example_ipa: '/ɔɪl/, /kɔɪn/, /vɔɪs/', example_zh: '油，硬币，声音', tip: 'oi 在词中，从圆唇"哦"快速滑向微笑"伊"' },
          { letter: 'oy', ipa: '/ɔɪ/', example: 'boy, toy, enjoy', example_ipa: '/bɔɪ/, /tɔɪ/, /ɪnˈdʒɔɪ/', example_zh: '男孩，玩具，享受', tip: 'oy 在词尾：boy, joy, toy, enjoy, deploy' },
          { letter: 'deploy', ipa: '/dɪˈplɔɪ/', example: 'Deploy the code to production.', example_ipa: '/dɪˈplɔɪ ðə koʊd tuː prəˈdʌkʃən/', example_zh: '把代码部署到生产环境。', tip: '编程必备词！deploy = 部署，/ɔɪ/ 结尾' },
          { letter: 'join', ipa: '/dʒɔɪn/', example: 'Join our team!', example_ipa: '/dʒɔɪn ˈaʊər tiːm/', example_zh: '加入我们的团队！', tip: 'join, point, voice — oi 家族高频词' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: '双元音需要嘴型做出滑动动作，不能发成单一元音！',
      targets: [
        { text: 'out, house, cow, how, oil, boy, enjoy, deploy', zh: '双元音单词', type: 'words' },
        { text: 'The boy found a coin outside the house.', zh: '男孩在房子外面找到了一枚硬币。', type: 'sentence' },
        { text: 'Join our team and enjoy deploying new code!', zh: '加入我们的团队，享受部署新代码的乐趣！', type: 'sentence' },
      ],
    },
  },

  // ─── Lesson 22: 常用不规则词 Sight Words ──────────────────────────────
  {
    id: 'phonics_22',
    title: 'Lesson 22 — 常用不规则词',
    subtitle: 'Sight Words — 不按规则发音的高频词',
    description: '英语中有一批高频词不遵循自然拼读规则，叫做"视觉词"（sight words）。这些词占英文写作的50%以上，必须整词记忆。学完这节课，你就完成了自然拼读全部22课！',
    objectives: ['认识并正确朗读最常见的不规则词', '理解为什么不按规则发音', '能在句子中流利使用这些词'],
    sections: [
      {
        id: 'sight_words_common',
        title: '最常见不规则词 Top Sight Words',
        subtitle: '整词记忆，不能拆分拼读',
        items: [
          { letter: 'the', ipa: '/ðə/ or /ðiː/', example: 'The cat is cute.', example_ipa: '/ðə kæt ɪz kjuːt/', example_zh: '这只猫很可爱。', tip: '最高频英文词！辅音前弱读/ðə/，元音前强读/ðiː/' },
          { letter: 'was', ipa: '/wɒz/', example: 'She was happy.', example_ipa: '/ʃiː wɒz ˈhæpi/', example_zh: '她很开心。', tip: 'was = a发/ɒ/，不按规则，is的过去式' },
          { letter: 'said', ipa: '/sɛd/', example: 'He said hello.', example_ipa: '/hiː sɛd həˈloʊ/', example_zh: '他打了招呼。', tip: 'said 发/sɛd/不是/seɪd/，ai 在这里例外' },
          { letter: 'have', ipa: '/hæv/', example: 'I have a question.', example_ipa: '/aɪ hæv ə ˈkwɛstʃən/', example_zh: '我有一个问题。', tip: 'have 中的 a 发/æ/，不受魔法E规则影响' },
          { letter: 'come', ipa: '/kʌm/', example: 'Come here, please.', example_ipa: '/kʌm hɪr pliːz/', example_zh: '请过来这里。', tip: 'come 的 o 发/ʌ/，不是/oʊ/，是不规则' },
          { letter: 'some', ipa: '/sʌm/', example: 'I need some help.', example_ipa: '/aɪ niːd sʌm hɛlp/', example_zh: '我需要一些帮助。', tip: 'some 和 come 一样，o 发/ʌ/' },
          { letter: 'where', ipa: '/wɛr/', example: 'Where is the meeting?', example_ipa: '/wɛr ɪz ðə ˈmiːtɪŋ/', example_zh: '会议在哪里？', tip: 'where 的 ere 发/ɛr/，不是/iːr/' },
          { letter: 'their', ipa: '/ðɛr/', example: 'They finished their work.', example_ipa: '/ðeɪ ˈfɪnɪʃt ðɛr wɜːrk/', example_zh: '他们完成了工作。', tip: 'their/there/they\'re — 三个同音词！' },
        ],
      },
    ],
    practice: {
      title: '发音练习',
      instructions: '恭喜完成自然拼读全22课！这节课练习不规则词，记住整词发音！',
      targets: [
        { text: 'the, was, said, have, come, some, where, their', zh: '高频不规则词', type: 'words' },
        { text: 'She said she was happy to come here.', zh: '她说她很高兴来到这里。', type: 'sentence' },
        { text: 'Where have their new features come from?', zh: '他们的新功能从哪里来的？', type: 'sentence' },
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

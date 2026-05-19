export const intonationLessons = [
  {
    id: 'intonation_01',
    title: 'Lesson 1 — 单词重音',
    subtitle: 'Word Stress — 每个词都有一个"主心骨"',
    description: '英语每个多音节单词都有一个最重读的音节（primary stress），读错重音整个词会让人听不懂。掌握重音规律是说出"有英文味"的第一步。',
    objectives: ['理解重音的概念', '识别2/3音节词的重音位置', '用对重音让词语被听懂'],
    sections: [
      {
        id: 'two_syllable',
        title: '两音节词 2-Syllable Words',
        subtitle: '名词/形容词多在第一音节重读，动词多在第二音节',
        items: [
          { letter: 'PHO·to', ipa: "/ˈfoʊ.toʊ/", example: 'Take a photo.', example_ipa: '', example_zh: '拍张照。', tip: '名词重第一音节：PHO-to，不是 pho-TO' },
          { letter: 'RE·cord', ipa: "/ˈrɛk.ərd/ 名词", example: 'Play the record.', example_ipa: '', example_zh: '放唱片。', tip: 'RE-cord（名词） vs re-CORD（动词）—— 同词重音位置不同！' },
          { letter: 're·CORD', ipa: "/rɪˈkɔːrd/ 动词", example: 'Please record this.', example_ipa: '', example_zh: '请录制这个。', tip: '动词重音在后：re-CORD，感受重音跳跃' },
          { letter: 'TO·day', ipa: "/təˈdeɪ/", example: 'What day is today?', example_ipa: '', example_zh: '今天是哪天？', tip: 'to-DAY，第二音节重读，第一音节弱化为/tə/' },
          { letter: 'COM·plex', ipa: "/ˈkɒm.plɛks/", example: 'This is complex.', example_ipa: '', example_zh: '这很复杂。', tip: '形容词 COM-plex，重第一音节' },
        ],
      },
      {
        id: 'three_syllable',
        title: '三音节词 3-Syllable Words',
        subtitle: '规律更多样，靠感觉 + 词典',
        items: [
          { letter: 'BA·na·na', ipa: "/bəˈnæ.nə/", example: 'I eat a banana.', example_ipa: '', example_zh: '我吃了一根香蕉。', tip: 'ba-NA-na，中间重读。常见误读：BA-na-na' },
          { letter: 'com·PU·ter', ipa: "/kəmˈpjuː.tər/", example: 'I use a computer.', example_ipa: '', example_zh: '我用电脑。', tip: 'com-PU-ter，中间重读，第一个 com 弱化' },
          { letter: 'MAN·ag·er', ipa: "/ˈmæn.ɪ.dʒər/", example: 'My manager is kind.', example_ipa: '', example_zh: '我的经理很好。', tip: 'MAN-ag-er，第一音节重，后两个音节很轻很快' },
          { letter: 'en·gi·NEER', ipa: "/ˌɛn.dʒɪˈnɪər/", example: 'She is an engineer.', example_ipa: '', example_zh: '她是工程师。', tip: 'en-gi-NEER，最后重读，"-eer"后缀词大多如此' },
          { letter: 'be·GIN·ner', ipa: "/bɪˈɡɪn.ər/", example: 'I am a beginner.', example_ipa: '', example_zh: '我是初学者。', tip: 'be-GIN-ner，中间重读，初学者很常用！' },
        ],
      },
    ],
    practice: {
      title: '重音练习',
      instructions: '注意每个词的重音位置，重读音节要比其他音节更响、更长、音调更高！',
      targets: [
        { text: 'photo, banana, computer, manager, engineer', zh: '词汇重音练习', type: 'words' },
        { text: 'My manager uses a computer every day.', zh: '每个词都用正确重音朗读。', type: 'sentence' },
        { text: 'The beginner became an engineer in three years.', zh: '那个初学者三年成了工程师。', type: 'sentence' },
      ],
    },
  },

  {
    id: 'intonation_02',
    title: 'Lesson 2 — 句子重音',
    subtitle: 'Sentence Stress — 内容词响，功能词轻',
    description: '英语句子中，名词、动词、形容词、副词（内容词）重读；冠词、介词、代词、助动词（功能词）弱读。这就是英语说出来"有节奏感"的秘密。',
    objectives: ['区分内容词与功能词', '自然弱化功能词', '让句子听起来有英语节奏'],
    sections: [
      {
        id: 'content_vs_function',
        title: '内容词 vs 功能词',
        subtitle: '内容词重读，功能词弱读',
        items: [
          { letter: '内容词', ipa: 'content words', example: 'CATS eat FISH in the MORNING.', example_ipa: '', example_zh: '猫在早晨吃鱼。', tip: 'CATS / eat / FISH / MORNING 是内容词，重读。in / the 是功能词，弱化。' },
          { letter: '功能词', ipa: 'function words', example: 'She is going to the park.', example_ipa: '', example_zh: '她要去公园。', tip: 'SHE / GO-ing / PARK 重读；is / to / the 弱读' },
          { letter: '强调', ipa: 'emphasis', example: 'I LOVE this song!', example_ipa: '', example_zh: '我超级爱这首歌！', tip: '想强调哪个词，就把那个词读得更响更长：I LOVE / I love THIS song / I love this SONG' },
          { letter: '新信息', ipa: 'new information', example: 'A: What did you buy? B: I bought a BOOK.', example_ipa: '', example_zh: 'A：你买了什么？B：我买了一本书。', tip: '新信息重读：BOOK 是回答的重点，读最重' },
          { letter: '对比', ipa: 'contrast', example: 'I like COFFEE, not TEA.', example_ipa: '', example_zh: '我喜欢咖啡，不是茶。', tip: '对比时两个词都重读：COFFEE 和 TEA 都响' },
        ],
      },
    ],
    practice: {
      title: '句子重音练习',
      instructions: '大写的词读得响亮清晰，其余词轻读快速掠过！',
      targets: [
        { text: 'She WORKS from HOME every FRIDAY.', zh: '她每周五在家办公。', type: 'sentence' },
        { text: 'I need to BUY a new PHONE tomorrow.', zh: '我明天要买一部新手机。', type: 'sentence' },
        { text: 'The MEETING starts at NINE in the MORNING.', zh: '会议早上九点开始。', type: 'sentence' },
      ],
    },
  },

  {
    id: 'intonation_03',
    title: 'Lesson 3 — 对比重音',
    subtitle: 'Contrastive Stress — 重音改变意思',
    description: '把句子中不同的词重读，可以完全改变说话的重点和含义。这是英语交流中非常重要的表达技巧，中文母语者通常没有意识到这一点。',
    objectives: ['通过改变重音位置来强调不同信息', '正确回应对方纠正时调整重音', '用重音表达对比和强调'],
    sections: [
      {
        id: 'contrastive',
        title: '对比重音练习 Contrastive Stress',
        subtitle: '同一句话，重音不同，意义不同',
        items: [
          { letter: 'I', ipa: 'stressing subject', example: 'I didn\'t take it. (He did.)', example_ipa: '', example_zh: '是我没拿（是别人拿的）。', tip: '强调主语：我没拿，是别人拿的' },
          { letter: "didn't", ipa: 'stressing negative', example: 'I DIDN\'T take it. (I swear!)', example_ipa: '', example_zh: '我真的没有拿！', tip: '强调否定：我真的没有！' },
          { letter: 'TAKE', ipa: 'stressing verb', example: 'I didn\'t TAKE it. (Just moved it.)', example_ipa: '', example_zh: '我没有拿走它（只是移动了一下）。', tip: '强调动作：不是拿走，是移动' },
          { letter: 'it', ipa: 'stressing object', example: 'I didn\'t take IT. (I took something else.)', example_ipa: '', example_zh: '我没有拿那个（我拿的是别的）。', tip: '强调宾语：拿的是别的东西' },
          { letter: '纠错重音', ipa: 'corrective stress', example: 'A: You went to Tokyo? B: No, I went to OSAKA.', example_ipa: '', example_zh: 'A：你去了东京？B：不，我去了大阪。', tip: '纠正时把正确信息重读：OSAKA 读最重' },
        ],
      },
    ],
    practice: {
      title: '对比重音练习',
      instructions: '体会重音位置改变后句子意思的变化，说出来让对方感受到区别！',
      targets: [
        { text: 'She didn\'t BUY the book. She BORROWED it.', zh: '她没有买那本书，她是借的。', type: 'sentence' },
        { text: 'I need the BLUE pen, not the red one.', zh: '我需要蓝色的笔，不是红色的。', type: 'sentence' },
        { text: 'We meet on MONDAY, not Tuesday.', zh: '我们周一见，不是周二。', type: 'sentence' },
      ],
    },
  },

  {
    id: 'intonation_04',
    title: 'Lesson 4 — 英语节奏',
    subtitle: 'Rhythm — 重音计时语言',
    description: '英语是"重音计时"语言（stress-timed）——两个重读音节之间的时间大致相等，无论中间夹着几个弱读音节。这与中文"音节计时"完全不同，是英语听起来"流畅""有音乐感"的核心原因。',
    objectives: ['理解英语节奏与中文节奏的本质区别', '练习让重音节奏均匀', '压缩弱读音节的时间'],
    sections: [
      {
        id: 'rhythm_patterns',
        title: '节奏训练 Rhythm Training',
        subtitle: '重音之间时间相等，弱读快速掠过',
        items: [
          { letter: '1拍', ipa: '•', example: 'CATS', example_ipa: '', example_zh: '猫（1拍）', tip: '单音节：节奏就是这个词本身' },
          { letter: '2拍', ipa: '• •', example: 'BIG CATS', example_ipa: '', example_zh: '大猫（2拍）', tip: '两重音节奏均匀，中间无停顿' },
          { letter: '3拍', ipa: '• • •', example: 'BIG BLACK CATS', example_ipa: '', example_zh: '大黑猫（3拍）', tip: '三重音，节奏规律，每拍时间一样' },
          { letter: '2拍(扩展)', ipa: '• ~ •', example: 'BIG black CATS', example_ipa: '', example_zh: '大黑猫（扩展）', tip: '同样是2拍，但中间夹了弱读词，整体时间不变！' },
          { letter: '2拍(更多)', ipa: '• ~~ •', example: 'BIG and black CATS', example_ipa: '', example_zh: '大黑猫（更多词）', tip: 'and 弱读成/ən/，and black 压缩到与 black 同样时间' },
        ],
      },
    ],
    practice: {
      title: '节奏练习',
      instructions: '可以拍手打拍子！重音落拍，弱读音节快速"塞"进拍子中间！',
      targets: [
        { text: 'CATS and DOGS', zh: '拍子：CATS — DOGS，and 快速掠过', type: 'words' },
        { text: 'I WANT a CUP of TEA.', zh: '3个拍子：WANT / CUP / TEA，其他词压缩', type: 'sentence' },
        { text: 'She\'s WORKING on a very IMPORTANT PROJECT.', zh: '3拍：WORKING / IMPORTANT / PROJECT，中间词压缩', type: 'sentence' },
      ],
    },
  },

  {
    id: 'intonation_05',
    title: 'Lesson 5 — 弱读',
    subtitle: 'Weak Forms — 功能词在句中"缩小"',
    description: '英语中的代词、冠词、介词、助动词、连词在句子中通常使用"弱读形式"——元音弱化为/ə/（中性元音）。这是自然英语听起来很"快"的主要原因之一。',
    objectives: ['识别功能词的弱读形式', '在流利朗读时自然弱化功能词', '理解为什么听力困难往往是弱读问题'],
    sections: [
      {
        id: 'weak_forms',
        title: '常见弱读词 Common Weak Forms',
        subtitle: '强读 vs 弱读，两种发音',
        items: [
          { letter: 'a / an', ipa: '/ə/ /ən/', example: 'I need a pen and an apple.', example_ipa: '', example_zh: '我需要一支笔和一个苹果。', tip: 'a→/ə/，an→/ən/，不要读成"诶"，快速掠过' },
          { letter: 'the', ipa: '/ðə/ or /ðɪ/', example: 'Give me the book.', example_ipa: '', example_zh: '把书给我。', tip: 'the 在辅音前读/ðə/，在元音前读/ðɪ/，都很轻' },
          { letter: 'to', ipa: '/tə/', example: 'I want to go to school.', example_ipa: '', example_zh: '我想去学校。', tip: 'to 弱读为/tə/，不是"too"。want to→"wanna"在口语中' },
          { letter: 'and', ipa: '/ən/', example: 'bread and butter', example_ipa: '', example_zh: '面包和黄油', tip: 'and 弱读成/ən/，连接词时几乎听不见，类似"n"' },
          { letter: 'for', ipa: '/fər/', example: 'a cup of tea for me', example_ipa: '', example_zh: '给我一杯茶', tip: 'for 弱读成/fər/，not "for" the full vowel' },
          { letter: 'of', ipa: '/əv/', example: 'a lot of people', example_ipa: '', example_zh: '很多人', tip: 'of 弱读成/əv/，几乎就是"ə"的一闪而过' },
        ],
      },
    ],
    practice: {
      title: '弱读练习',
      instructions: '让功能词"消失"在句子中，重读词才是句子的骨架！',
      targets: [
        { text: 'a lot of people', zh: 'of 弱读成/əv/，lot和people重读', type: 'words' },
        { text: 'I want to go to the store and buy some bread.', zh: '功能词全部弱化，注意节奏', type: 'sentence' },
        { text: 'Can you give me a cup of coffee for the meeting?', zh: '感受弱读后句子的流畅感', type: 'sentence' },
      ],
    },
  },

  {
    id: 'intonation_06',
    title: 'Lesson 6 — 缩读',
    subtitle: 'Contractions — I\'m, don\'t, it\'s',
    description: '英语口语中大量使用缩读形式（contractions）。不使用缩读会让你的英语听起来很正式甚至生硬。掌握缩读是口语自然度的重要标志。',
    objectives: ['掌握常用缩读的发音', '在口语中自然使用缩读', '识别听力中的缩读形式'],
    sections: [
      {
        id: 'be_contractions',
        title: 'be动词缩读 Be Verb Contractions',
        subtitle: "I'm, you're, he's, she's, it's, we're, they're",
        items: [
          { letter: "I'm", ipa: "/aɪm/", example: "I'm so tired.", example_ipa: '', example_zh: '我好累。', tip: '不要说 "I am" 除非强调；日常都用 I\'m' },
          { letter: "you're", ipa: "/jɔːr/", example: "You're amazing!", example_ipa: '', example_zh: '你太厉害了！', tip: 'you\'re=/jɔːr/，注意区别 your（你的）发音一样！' },
          { letter: "he's / she's", ipa: "/hiːz/ /ʃiːz/", example: "He's busy. She's free.", example_ipa: '', example_zh: '他很忙。她有空。', tip: '既可以缩 is，也可以缩 has：He\'s gone = He has gone' },
          { letter: "it's", ipa: "/ɪts/", example: "It's a great idea!", example_ipa: '', example_zh: '这是个好主意！', tip: "it's = it is；its（没撇号）= 它的，注意区分" },
        ],
      },
      {
        id: 'aux_contractions',
        title: '助动词缩读 Auxiliary Contractions',
        subtitle: "don't, can't, won't, shouldn't, I'll, I've, I'd",
        items: [
          { letter: "don't", ipa: "/doʊnt/", example: "I don't know.", example_ipa: '', example_zh: '我不知道。', tip: 'do not → don\'t，结尾 t 很轻，do-n-t 连在一起' },
          { letter: "can't", ipa: "/kænt/", example: "I can't come today.", example_ipa: '', example_zh: '我今天来不了。', tip: 'can\'t 中的 a 发/æ/，比 can 更重更短，帮助区分' },
          { letter: "won't", ipa: "/woʊnt/", example: "It won't work.", example_ipa: '', example_zh: '这行不通。', tip: 'won\'t = will not，注意 wo 发/woʊ/不是 "wo"' },
          { letter: "I'll / I've / I'd", ipa: "/aɪl/ /aɪv/ /aɪd/", example: "I'll call. I've tried. I'd love to.", example_ipa: '', example_zh: '我会打的。我试过了。我很乐意。', tip: '三个都以/aɪ/开头，后面轻轻带 l/v/d' },
        ],
      },
    ],
    practice: {
      title: '缩读练习',
      instructions: '口语中要主动用缩读形式，不用缩读会显得很正式！',
      targets: [
        { text: "I'm busy but I'll try. Don't worry.", zh: '缩读+口语化的自然表达', type: 'sentence' },
        { text: "She's not here yet. It's probably traffic.", zh: '两个缩读，感受口语流畅度', type: 'sentence' },
        { text: "I can't make it. I've got a meeting that won't end.", zh: '三个缩读，练习连贯表达', type: 'sentence' },
      ],
    },
  },

  {
    id: 'intonation_07',
    title: 'Lesson 7 — 连读',
    subtitle: 'Linking — 词与词之间的桥梁',
    description: '英语自然说话时，相邻的词会连在一起，特别是"辅音结尾 + 元音开头"的组合。连读让英语听起来流畅，不连读会让英语显得一字一顿、不自然。',
    objectives: ['识别连读发生的场合', '掌握辅音+元音连读规则', '自然地应用连读提升流畅度'],
    sections: [
      {
        id: 'consonant_vowel_linking',
        title: '辅音+元音连读 Consonant + Vowel Linking',
        subtitle: '前词辅音尾 + 后词元音头 → 连读',
        items: [
          { letter: 'pick it up', ipa: '/pɪ.kɪ.tʌp/', example: 'Can you pick it up?', example_ipa: '', example_zh: '你能把它捡起来吗？', tip: 'pick-it-up，k+i连，t+u连，听起来像三个音节连在一起' },
          { letter: 'turn it on', ipa: '/tɜː.nɪ.tɒn/', example: 'Turn it on, please.', example_ipa: '', example_zh: '请打开它。', tip: 'turn-it-on，n+i连，t+o连，连成流畅的一串' },
          { letter: 'come on', ipa: '/kʌ.mɒn/', example: 'Come on! Let\'s go!', example_ipa: '', example_zh: '快点！走吧！', tip: 'come-on，m+o连，听起来像 "kuh-MON"' },
          { letter: 'look at', ipa: '/lʊ.kæt/', example: 'Look at this!', example_ipa: '', example_zh: '看这个！', tip: 'look-at，k+a连，快速说变成 "luh-KAT"' },
          { letter: 'not at all', ipa: '/nɒ.tæ.tɔːl/', example: 'Not at all, you\'re welcome.', example_ipa: '', example_zh: '不客气，您太客气了。', tip: '两次连读：not-at, at-all，整句连成一串' },
        ],
      },
    ],
    practice: {
      title: '连读练习',
      instructions: '把词与词之间的界限模糊掉，让它们像一个长词一样流出来！',
      targets: [
        { text: 'pick it up, turn it on, look at it', zh: '辅音+元音连读短语', type: 'words' },
        { text: 'Can you turn it on and look at the screen?', zh: '句子中自然连读', type: 'sentence' },
        { text: 'Not at all! Come on, let\'s figure it out.', zh: '多处连读，感受流畅的英语', type: 'sentence' },
      ],
    },
  },

  {
    id: 'intonation_08',
    title: 'Lesson 8 — 省音与同化',
    subtitle: 'Elision & Assimilation — 音素的"消失"与"融合"',
    description: '在快速自然的英语口语中，一些音素会被省略（省音），或者相邻音素互相影响产生融合（同化）。听懂native说话的关键就是理解这些"变音"规律。',
    objectives: ['理解省音：某些音在口语中消失', '理解同化：相邻音互相影响变化', '能够模仿自然语流中的这些变化'],
    sections: [
      {
        id: 'elision',
        title: '省音 Elision — 音素消失',
        subtitle: '快速说话时某些音会被省略',
        items: [
          { letter: 'next day', ipa: '/nɛks deɪ/', example: 'See you next day!', example_ipa: '', example_zh: '明天见！', tip: 'next 的 t 在 day 前消失：nex\' day，t 被省掉' },
          { letter: 'last time', ipa: '/læs taɪm/', example: 'This is the last time.', example_ipa: '', example_zh: '这是最后一次。', tip: 'last 的 t 在 time 前消失：las\' time' },
          { letter: 'gonna', ipa: '/ˈɡɒnə/', example: 'I\'m gonna call you.', example_ipa: '', example_zh: '我要给你打电话。', tip: 'going to → gonna，口语中 going to 几乎总是 gonna' },
          { letter: 'wanna', ipa: '/ˈwɒnə/', example: 'I wanna know more.', example_ipa: '', example_zh: '我想了解更多。', tip: 'want to → wanna，非正式口语常见' },
        ],
      },
      {
        id: 'assimilation',
        title: '同化 Assimilation — 音素融合',
        subtitle: '相邻音互相影响产生新的音',
        items: [
          { letter: 'don\'t you', ipa: '/doʊntʃuː/', example: 'Don\'t you think so?', example_ipa: '', example_zh: '你不这么认为吗？', tip: 't + y 融合成 /tʃ/，don\'t you → "don-chu"' },
          { letter: 'did you', ipa: '/dɪdʒuː/', example: 'Did you go?', example_ipa: '', example_zh: '你去了吗？', tip: 'd + y 融合成 /dʒ/，did you → "did-juh"' },
          { letter: 'this year', ipa: '/ðɪʃˈjɪr/', example: 'I graduated this year.', example_ipa: '', example_zh: '我今年毕业了。', tip: 's + y 融合成 /ʃ/，this year → "this-shear"' },
        ],
      },
    ],
    practice: {
      title: '省音同化练习',
      instructions: '尝试模仿这些自然的音变，让英语更接近native的节奏！',
      targets: [
        { text: 'I\'m gonna call you next time.', zh: 'gonna + next time 省音', type: 'sentence' },
        { text: 'Don\'t you wanna learn more this year?', zh: "don't you融合 + wanna省读 + this year同化", type: 'sentence' },
        { text: 'Did you have a good time last night?', zh: 'did you融合 + last night省音', type: 'sentence' },
      ],
    },
  },

  {
    id: 'intonation_09',
    title: 'Lesson 9 — 降调',
    subtitle: 'Falling Intonation ↘ — 语调向下',
    description: '陈述句、wh-疑问句和命令句通常以降调结尾，表示信息完整、确定或权威。降调是英语最常见的语调模式，说错容易让人感觉你在问问题而不是在陈述事实。',
    objectives: ['掌握陈述句的降调', '掌握wh-疑问句的降调', '区分降调与升调的使用场合'],
    sections: [
      {
        id: 'falling_patterns',
        title: '降调句型 Falling Intonation Patterns',
        subtitle: '句尾音调向下 ↘',
        items: [
          { letter: '陈述句 ↘', ipa: 'statements', example: 'I work at Google.↘', example_ipa: '', example_zh: '我在谷歌工作。↘', tip: '陈述句：说完一个完整信息，语调下降，表示"说完了"' },
          { letter: 'wh-问句 ↘', ipa: 'wh-questions', example: 'Where do you work?↘', example_ipa: '', example_zh: '你在哪里工作？↘', tip: 'wh-问句（who/what/where/when/why/how）也用降调！' },
          { letter: '命令句 ↘', ipa: 'imperatives', example: 'Please close the door.↘', example_ipa: '', example_zh: '请关门。↘', tip: '命令句语调下降，表示权威或请求（配合 please 显得礼貌）' },
          { letter: '感叹句 ↘', ipa: 'exclamations', example: 'What a great idea!↘', example_ipa: '', example_zh: '多好的主意啊！↘', tip: '感叹句语调先升后降，表示惊喜或赞叹' },
        ],
      },
    ],
    practice: {
      title: '降调练习',
      instructions: '每句话说到最后一个重音词时开始往下走，不要让句尾飘上去！',
      targets: [
        { text: 'I live in Beijing.', zh: '陈述句降调 ↘', type: 'sentence' },
        { text: 'Where are you from? What do you do?', zh: 'wh-问句降调 ↘', type: 'sentence' },
        { text: 'Please send me the report by Friday.', zh: '请求句降调 ↘', type: 'sentence' },
      ],
    },
  },

  {
    id: 'intonation_10',
    title: 'Lesson 10 — 升调',
    subtitle: 'Rising Intonation ↗ — 语调向上',
    description: '一般疑问句（yes/no questions）和列举未完成的内容使用升调。升调传达"我还没说完"或"我需要你确认"的信息。错误地使用升调可能让陈述听起来像提问。',
    objectives: ['掌握一般疑问句的升调', '掌握列举中的升调', '区分确定（降调）和不确定（升调）'],
    sections: [
      {
        id: 'rising_patterns',
        title: '升调句型 Rising Intonation Patterns',
        subtitle: '句尾音调向上 ↗',
        items: [
          { letter: '一般疑问句 ↗', ipa: 'yes/no questions', example: 'Are you ready?↗', example_ipa: '', example_zh: '你准备好了吗？↗', tip: '可以用yes/no回答的问题，句尾升调↗' },
          { letter: '确认问句 ↗', ipa: 'tag questions', example: 'You work here, don\'t you?↗', example_ipa: '', example_zh: '你在这里工作，对吧？↗', tip: '附加疑问句，寻求确认时升调↗' },
          { letter: '列举未完 ↗', ipa: 'listing', example: 'I need apples↗, oranges↗, and bananas.↘', example_ipa: '', example_zh: '我需要苹果、橙子和香蕉。', tip: '列举时前几项升调，最后一项降调表示列举完了' },
          { letter: '犹豫不确定 ↗', ipa: 'uncertainty', example: 'Well... maybe?↗', example_ipa: '', example_zh: '嗯……也许吧？↗', tip: '不确定、犹豫时升调，表示"我不太确定"' },
          { letter: '表示兴趣 ↗', ipa: 'backchannels', example: 'Really?↗ Oh yeah?↗', example_ipa: '', example_zh: '真的吗？↗ 哦是吗？↗', tip: '对话中表示在听、有兴趣时用升调，是礼貌信号' },
        ],
      },
    ],
    practice: {
      title: '升调练习',
      instructions: '问问题时尾音往上走！感受升调带来的"开放、询问"的感觉！',
      targets: [
        { text: 'Do you speak English?', zh: '一般疑问句升调 ↗', type: 'sentence' },
        { text: 'I need coffee↗, tea↗, and water.↘', zh: '列举：前升后降', type: 'sentence' },
        { text: 'You\'re from China, right?', zh: '确认升调 ↗', type: 'sentence' },
      ],
    },
  },

  {
    id: 'intonation_11',
    title: 'Lesson 11 — 综合练习',
    subtitle: 'Putting It All Together — 自然对话',
    description: '恭喜完成语音语调全部10课基础学习！本课综合运用重音、节奏、弱读、连读和语调，在真实对话语境中练习，目标是说出自然流畅的英语。',
    objectives: ['在完整对话中综合运用所有语调技巧', '培养"英语耳朵"和英语节奏感', '建立流利表达的信心'],
    sections: [
      {
        id: 'full_dialogue',
        title: '完整对话练习 Full Conversation',
        subtitle: '综合重音 + 弱读 + 连读 + 语调',
        items: [
          { letter: '问候对话', ipa: 'greetings', example: 'Hey! How\'s it going? — Pretty good, thanks!', example_ipa: '', example_zh: '嘿！最近怎么样？——还不错，谢谢！', tip: 'How\'s 缩读，going 弱读 it，pretty 重读，自然流畅' },
          { letter: '工作对话', ipa: 'work talk', example: 'What do you do? — I\'m a software engineer.', example_ipa: '', example_zh: '你是做什么的？——我是软件工程师。', tip: 'What 重读，do you 弱读，I\'m 缩读，engineer 末音节重读' },
          { letter: '询问对话', ipa: 'asking', example: 'Could you help me out?↗ — Sure, not a problem.↘', example_ipa: '', example_zh: '你能帮我一下吗？——当然，没问题。', tip: '请求句升调↗，肯定回答降调↘' },
          { letter: '建议对话', ipa: 'suggestions', example: 'Why don\'t we grab some coffee?↗', example_ipa: '', example_zh: '我们去喝点咖啡怎么样？↗', tip: "Why don't we = 常见建议句式，语调轻松上扬" },
          { letter: '道别对话', ipa: 'farewell', example: 'It was great talking to you. Take care!↘', example_ipa: '', example_zh: '很高兴和你聊天。保重！↘', tip: '道别降调↘，表示对话完满结束' },
        ],
      },
    ],
    practice: {
      title: '综合对话练习',
      instructions: '把所有学过的语调技巧都用上！重音、弱读、连读、升降调缺一不可！',
      targets: [
        { text: 'Hey! How\'s it going? I\'m doing pretty well, thanks!', zh: '问候+回答，注意缩读和弱读', type: 'sentence' },
        { text: 'Could you tell me where the nearest coffee shop is?', zh: '询问方向，升调+连读', type: 'sentence' },
        { text: 'It\'s been great talking to you. Let\'s catch up again soon!', zh: '道别，缩读+降调，自然收尾', type: 'sentence' },
      ],
    },
  },
]

export const getIntonationLesson = (lessonId) => intonationLessons.find(l => l.id === lessonId)

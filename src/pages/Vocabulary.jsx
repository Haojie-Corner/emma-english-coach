import Card from '../components/ui/Card'

const Vocabulary = () => (
  <div className="max-w-2xl mx-auto px-4 py-6">
    <h1 className="text-xl font-bold text-[#141413] mb-2" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>
      📖 词汇本
    </h1>
    <p className="text-sm text-[#b0aea5] mb-6">基于遗忘曲线安排复习，学过的单词不再忘</p>
    <Card className="text-center py-12">
      <p className="text-4xl mb-3">📚</p>
      <p className="font-semibold text-[#141413]">词汇本即将上线</p>
      <p className="text-sm text-[#b0aea5] mt-1">完成课程学习后，生词会自动保存到这里</p>
    </Card>
  </div>
)

export default Vocabulary

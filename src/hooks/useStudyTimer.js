import { useEffect } from 'react'
import { startLessonTimer } from '../utils/studyTime'

const useStudyTimer = () => {
  useEffect(() => {
    const cleanup = startLessonTimer()
    return cleanup
  }, [])
}

export default useStudyTimer

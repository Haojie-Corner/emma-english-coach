import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CourseOverview from './pages/Course/CourseOverview'
import PhonicsModule from './pages/Course/PhonicsModule'
import PhonicsLesson from './pages/Course/PhonicsLesson'
import Speaking from './pages/Practice/Speaking'
import Vocabulary from './pages/Vocabulary'
import Profile from './pages/Profile'

const ComingSoon = ({ name }) => (
  <div className="max-w-2xl mx-auto px-4 py-16 text-center">
    <p className="text-4xl mb-4">🚧</p>
    <p className="font-semibold text-[#141413]" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>{name} 即将上线</p>
    <p className="text-sm text-[#b0aea5] mt-2">正在开发中，敬请期待</p>
  </div>
)

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'course', element: <CourseOverview /> },
          { path: 'course/phonics', element: <PhonicsModule /> },
          { path: 'course/phonics/:lessonId', element: <PhonicsLesson /> },
          { path: 'course/intonation', element: <ComingSoon name="语音语调" /> },
          { path: 'course/mindset', element: <ComingSoon name="认知重塑" /> },
          { path: 'course/scenes', element: <ComingSoon name="场景实战" /> },
          { path: 'course/demo', element: <ComingSoon name="场景演绎" /> },
          { path: 'course/tech', element: <ComingSoon name="编程英语" /> },
          { path: 'practice/speaking', element: <Speaking /> },
          { path: 'vocabulary', element: <Vocabulary /> },
          { path: 'profile', element: <Profile /> },
        ],
      },
    ],
  },
])

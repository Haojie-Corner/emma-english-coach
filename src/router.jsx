import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CourseOverview from './pages/Course/CourseOverview'
import PhonicsModule from './pages/Course/PhonicsModule'
import PhonicsLesson from './pages/Course/PhonicsLesson'
import IntonationModule from './pages/Course/IntonationModule'
import IntonationLesson from './pages/Course/IntonationLesson'
import ScenesModule from './pages/Course/ScenesModule'
import SceneLesson from './pages/Course/SceneLesson'
import MindsetModule from './pages/Course/MindsetModule'
import MindsetLesson from './pages/Course/MindsetLesson'
import DemoModule from './pages/Course/DemoModule'
import DemoLesson from './pages/Course/DemoLesson'
import FluencyModule from './pages/Course/FluencyModule'
import FluencyLesson from './pages/Course/FluencyLesson'
import Speaking from './pages/Practice/Speaking'
import Vocabulary from './pages/Vocabulary'
import Profile from './pages/Profile'
import TeacherChat from './pages/TeacherChat'

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
          { path: 'course/intonation', element: <IntonationModule /> },
          { path: 'course/intonation/:lessonId', element: <IntonationLesson /> },
          { path: 'course/scenes', element: <ScenesModule /> },
          { path: 'course/scenes/:sceneId', element: <SceneLesson /> },
          { path: 'course/mindset', element: <MindsetModule /> },
          { path: 'course/mindset/:lessonId', element: <MindsetLesson /> },
          { path: 'course/demo', element: <DemoModule /> },
          { path: 'course/demo/:lessonId', element: <DemoLesson /> },
          { path: 'course/fluency', element: <FluencyModule /> },
          { path: 'course/fluency/:lessonId', element: <FluencyLesson /> },
          { path: 'course/tech', element: <Navigate to="/practice/speaking" replace /> },
          { path: 'practice/speaking', element: <Speaking /> },
          { path: 'vocabulary', element: <Vocabulary /> },
          { path: 'profile', element: <Profile /> },
          { path: 'teacher', element: <TeacherChat /> },
        ],
      },
    ],
  },
])

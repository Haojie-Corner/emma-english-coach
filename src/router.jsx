import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'

// Route-level lazy loading — each module loads only when first visited
const Dashboard       = lazy(() => import('./pages/Dashboard'))
const CourseOverview  = lazy(() => import('./pages/Course/CourseOverview'))
const PhonicsModule   = lazy(() => import('./pages/Course/PhonicsModule'))
const PhonicsLesson   = lazy(() => import('./pages/Course/PhonicsLesson'))
const IntonationModule = lazy(() => import('./pages/Course/IntonationModule'))
const IntonationLesson = lazy(() => import('./pages/Course/IntonationLesson'))
const ScenesModule    = lazy(() => import('./pages/Course/ScenesModule'))
const SceneLesson     = lazy(() => import('./pages/Course/SceneLesson'))
const MindsetModule   = lazy(() => import('./pages/Course/MindsetModule'))
const MindsetLesson   = lazy(() => import('./pages/Course/MindsetLesson'))
const DemoModule      = lazy(() => import('./pages/Course/DemoModule'))
const DemoLesson      = lazy(() => import('./pages/Course/DemoLesson'))
const FluencyModule   = lazy(() => import('./pages/Course/FluencyModule'))
const FluencyLesson   = lazy(() => import('./pages/Course/FluencyLesson'))
const Speaking        = lazy(() => import('./pages/Practice/Speaking'))
const Vocabulary      = lazy(() => import('./pages/Vocabulary'))
const Profile         = lazy(() => import('./pages/Profile'))
const TeacherChat     = lazy(() => import('./pages/TeacherChat'))

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
    <span className="spin" style={{ display: 'inline-block', fontSize: 28 }}>⏳</span>
  </div>
)

const S = (El) => (
  <Suspense fallback={<PageLoader />}><El /></Suspense>
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
          { path: 'dashboard',                    element: S(Dashboard) },
          { path: 'course',                       element: S(CourseOverview) },
          { path: 'course/phonics',               element: S(PhonicsModule) },
          { path: 'course/phonics/:lessonId',     element: S(PhonicsLesson) },
          { path: 'course/intonation',            element: S(IntonationModule) },
          { path: 'course/intonation/:lessonId',  element: S(IntonationLesson) },
          { path: 'course/scenes',                element: S(ScenesModule) },
          { path: 'course/scenes/:sceneId',       element: S(SceneLesson) },
          { path: 'course/mindset',               element: S(MindsetModule) },
          { path: 'course/mindset/:lessonId',     element: S(MindsetLesson) },
          { path: 'course/demo',                  element: S(DemoModule) },
          { path: 'course/demo/:lessonId',        element: S(DemoLesson) },
          { path: 'course/fluency',               element: S(FluencyModule) },
          { path: 'course/fluency/:lessonId',     element: S(FluencyLesson) },
          { path: 'course/tech',                  element: <Navigate to="/practice/speaking" replace /> },
          { path: 'practice/speaking',            element: S(Speaking) },
          { path: 'vocabulary',                   element: S(Vocabulary) },
          { path: 'profile',                      element: S(Profile) },
          { path: 'teacher',                      element: S(TeacherChat) },
        ],
      },
    ],
  },
])

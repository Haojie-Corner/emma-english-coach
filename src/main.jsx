import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './router'
import useUserStore from './store/userStore'

const App = () => {
  const { init, loading } = useUserStore()

  useEffect(() => { init() }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🎓</div>
          <p className="text-[#b0aea5] text-sm" style={{ fontFamily: 'Poppins, Arial, sans-serif' }}>加载中…</p>
        </div>
      </div>
    )
  }

  return <RouterProvider router={router} />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

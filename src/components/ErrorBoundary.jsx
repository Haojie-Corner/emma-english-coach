import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: '#f5f3ef',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            background: '#fff', borderRadius: 22, padding: '32px 28px',
            maxWidth: 380, width: '100%', textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😅</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f0e0c', marginBottom: 10 }}>
              页面出了点问题
            </h2>
            <p style={{ fontSize: 13, color: '#5c5850', lineHeight: 1.65, marginBottom: 24 }}>
              这个页面遇到了一个意外错误。你的学习记录不会丢失，刷新页面即可继续。
            </p>
            {this.state.error?.message && (
              <p style={{
                fontSize: 11, color: '#9e998e', background: '#f5f3ef',
                borderRadius: 10, padding: '8px 12px', marginBottom: 20,
                fontFamily: 'monospace', wordBreak: 'break-all',
              }}>
                {this.state.error.message.slice(0, 120)}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                width: '100%', minHeight: 46, borderRadius: 14,
                background: 'linear-gradient(135deg, #f28040, #e05020)',
                color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 3px 12px rgba(232,103,42,0.3)',
              }}
            >
              刷新页面
            </button>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/dashboard' }}
              style={{
                width: '100%', minHeight: 42, borderRadius: 14, marginTop: 10,
                background: '#f5f3ef', color: '#5c5850',
                border: '1.5px solid #e5e1d8', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              返回首页
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary

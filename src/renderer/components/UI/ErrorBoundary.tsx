import { Component, ErrorInfo, ReactNode } from 'react'

type Props = {
  children: ReactNode
  fallback?: ReactNode
}

type State = {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg)',
          padding: '2rem',
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '520px',
            width: '100%',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>♟</div>

            <h2 style={{
              margin: '0 0 0.5rem',
              fontSize: '20px',
              color: 'var(--text-primary)',
            }}>
              Something went wrong
            </h2>

            <p style={{
              margin: '0 0 1.5rem',
              fontSize: '14px',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
            }}>
              Chess Trainer ran into an unexpected error. You can try
              recovering below or restart the app if the problem persists.
            </p>

            {/* Error details — collapsible */}
            {this.state.error && (
              <details style={{
                marginBottom: '1.5rem',
                textAlign: 'left',
                background: 'var(--red-bg)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                border: '1px solid var(--border)',
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--red)',
                  userSelect: 'none',
                }}>
                  Error details
                </summary>
                <pre style={{
                  marginTop: '0.75rem',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontFamily: 'monospace',
                  lineHeight: 1.5,
                }}>
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => this.handleReset()}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Try to recover
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: '1.5px solid var(--border-strong)',
                  background: 'var(--bg)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Reload app
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
  componentStack?: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || String(error),
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    this.setState({
      componentStack: errorInfo?.componentStack || undefined,
    })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 900 }}>
          <h2 style={{ marginTop: 0 }}>Something went wrong.</h2>
          {this.state.errorMessage ? (
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                background: '#f5f7fa',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: 12,
                color: '#0f172a',
              }}
            >
              {this.state.errorMessage}
            </pre>
          ) : null}
          {this.state.componentStack ? (
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: 8,
                padding: 12,
                color: '#9a3412',
                fontSize: 12,
                maxHeight: 320,
                overflow: 'auto',
              }}
            >
              {this.state.componentStack}
            </pre>
          ) : null}
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 12,
              padding: '10px 16px',
              border: 0,
              borderRadius: 8,
              background: '#ff6b1a',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Recharger
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

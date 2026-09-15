import React, { Component, ErrorInfo, ReactNode } from 'react'
import { isChunkLoadError, reloadForFreshAssets } from '@/utils/lazyWithRetry'

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
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
    if (isChunkLoadError(error) && reloadForFreshAssets()) {
      return
    }
  }

  public render() {
    if (this.state.hasError) {
      if (isChunkLoadError(this.state.errorMessage)) {
        return (
          <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
            <p>Updating…</p>
          </div>
        )
      }
      return this.props.fallback || (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          <h2>Something went wrong.</h2>
          <button type="button" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

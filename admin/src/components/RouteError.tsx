import React from 'react'
import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { isChunkLoadError, reloadForFreshAssets } from '@/utils/lazyWithRetry'

const RouteError = () => {
  const error = useRouteError()

  if (isChunkLoadError(error) && reloadForFreshAssets()) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
        <p>Updating…</p>
      </div>
    )
  }

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : String(error ?? 'Unknown error')

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '40px auto' }}>
      <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
      <p style={{ color: '#64748b' }}>
        Reload the page. If it persists, clear your browser cache.
      </p>
      <pre
        style={{
          whiteSpace: 'pre-wrap',
          background: '#f5f7fa',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          padding: 12,
          color: '#0f172a',
          fontSize: 13,
        }}
      >
        {message}
      </pre>
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
        Reload
      </button>
    </div>
  )
}

export default RouteError

import React from 'react'
import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { isChunkLoadError, reloadForFreshAssets } from '@/utils/lazyWithRetry'

/**
 * React Router errorElement — recovers from stale JS chunks instead of showing
 * the default "Unexpected Application Error!" screen.
 */
const RouteError = () => {
  const error = useRouteError()

  if (isChunkLoadError(error) && reloadForFreshAssets()) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
        <p>Mise à jour en cours…</p>
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
      <h2 style={{ marginTop: 0 }}>Une erreur est survenue</h2>
      <p style={{ color: '#64748b' }}>
        Rechargez la page. Si le problème continue, videz le cache du navigateur.
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
        onClick={() => window.location.assign('/')}
        style={{
          marginTop: 12,
          marginRight: 8,
          padding: '10px 16px',
          border: 0,
          borderRadius: 8,
          background: '#ff6b1a',
          color: '#fff',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Accueil
      </button>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          marginTop: 12,
          padding: '10px 16px',
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          background: '#fff',
          color: '#0f172a',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Recharger
      </button>
    </div>
  )
}

export default RouteError

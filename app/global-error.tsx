'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log global error
    console.error('Global application error:', error)

    // Optionally log to error tracking service
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error)
    // }
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Something went wrong!
          </h1>
          <p style={{ marginBottom: '2rem', color: '#666' }}>
            An unexpected error occurred. Please refresh the page.
          </p>
          <div style={{
            padding: '1rem',
            backgroundColor: '#f5f5f5',
            borderRadius: '0.25rem',
            marginBottom: '2rem',
            maxWidth: '600px',
            overflow: 'auto'
          }}>
            <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#666' }}>
              {error.message}
            </p>
            {error.digest && (
              <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#999', marginTop: '0.5rem' }}>
                Digest: {error.digest}
              </p>
            )}
          </div>
          <button
            onClick={reset}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}


'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { defaultLocale } from '@/i18n/config'
import { getTranslation } from '@/i18n/utils'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  loadingFallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  isLoading?: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  private t(key: string, fallback: string): string {
    return getTranslation(defaultLocale, key, fallback)
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-center">
              <div className="space-y-3">
                <p className="font-medium">
                  {this.t('errorBoundary.title', 'Something went wrong!')}
                </p>
                <p className="text-sm opacity-90">
                  {this.t(
                    'errorBoundary.description',
                    'An unexpected error occurred. This usually happens due to temporary network issues or cold starts.'
                  )}
                </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        this.setState({ isLoading: true })
                        setTimeout(() => {
                          window.location.reload()
                        }, 500)
                      }}
                      className="w-full sm:w-auto"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {this.state.isLoading
                        ? this.t('errorBoundary.reloading', 'Reloading...')
                        : this.t('errorBoundary.reloadPage', 'Reload Page')}
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => {
                        this.setState({ hasError: false, error: undefined, isLoading: false })
                      }}
                      className="w-full sm:w-auto"
                    >
                      {this.t('common.tryAgain', 'Try Again')}
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>{this.t('errorBoundary.possibleCausesTitle', 'If this persists, the issue might be:')}</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>
                        {this.t(
                          'errorBoundary.causeColdStart',
                          'Server cold start (try again in 30 seconds)'
                        )}
                      </li>
                      <li>{this.t('errorBoundary.causeNetwork', 'Temporary network issues')}</li>
                      <li>{this.t('errorBoundary.causeDatabase', 'Database connection problems')}</li>
                    </ul>
                  </div>
                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="mt-4 text-xs text-left">
                      <summary className="cursor-pointer font-mono">
                        {this.t('errorBoundary.detailsTitle', 'Error details')}
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

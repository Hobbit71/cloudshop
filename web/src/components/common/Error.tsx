import React from 'react'

export type ErrorDisplayProps = {
  title?: string
  message?: string
}

export function ErrorDisplay({ title = 'Something went wrong', message = 'Please try again.' }: ErrorDisplayProps) {
  return (
    <div role="alert" className="rounded border border-red-200 bg-red-50 p-4 text-red-700">
      <p className="font-medium">{title}</p>
      <p className="text-sm">{message}</p>
    </div>
  )
}

type ErrorBoundaryState = { hasError: boolean }

// Error boundary to catch rendering errors in subtree
// Example:
// <ErrorBoundary><YourComponent/></ErrorBoundary>
export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('ErrorBoundary caught error', error)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorDisplay />
    }
    return this.props.children
  }
}



import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

// Simple error boundary to prevent a blank white page on runtime errors.
export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
  // Log to console and attach to window for quick inspection on GitHub Pages.
  // (Avoid external logging dependencies for this static site.)
  console.error('[ErrorBoundary] Caught error', error, info);
  (window as unknown as { __LAST_ERROR__?: unknown }).__LAST_ERROR__ = { error, info };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert">
          <h2>Something went wrong.</h2>
          <p>{this.state.message}</p>
          <button onClick={() => location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

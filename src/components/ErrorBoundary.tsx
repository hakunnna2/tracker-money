import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled application error:', error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh bg-brand-bg flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-brand border border-slate-100 text-center">
            <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
            <p className="mt-3 text-sm text-brand-muted">
              The app hit an unexpected error. Your saved data is still in local storage.
            </p>
            <button
              onClick={this.handleReload}
              className="mt-6 w-full bg-brand-blue hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

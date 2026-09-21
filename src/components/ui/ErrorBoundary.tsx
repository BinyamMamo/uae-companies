import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Without this, a single malformed company record or a corrupt localStorage
 * value takes the whole page to blank white.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  handleClearData = () => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('uae_'))
        .forEach(k => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-app p-6">
        <div className="max-w-md w-full bg-surface border border-line rounded-xl p-6 shadow-subtle">
          <h1 className="text-lg font-semibold text-ink">Something went wrong</h1>
          <p className="text-sm text-ink-2 mt-2">
            The page hit an unexpected error. You can try again, or clear this site's saved
            data if the problem keeps happening.
          </p>
          <pre className="mt-3 text-[11px] text-ink-3 bg-surface-2 border border-line rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
            {error.message}
          </pre>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={this.handleReset}
              className="px-3 py-2 text-xs font-semibold rounded-md bg-brand-600 hover:bg-brand-700 text-white transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-2 text-xs font-semibold rounded-md border border-line text-ink-2 hover:bg-surface-2 transition-colors"
            >
              Reload page
            </button>
            <button
              onClick={this.handleClearData}
              className="px-3 py-2 text-xs font-semibold rounded-md border border-line text-ink-2 hover:bg-surface-2 transition-colors"
            >
              Clear saved data
            </button>
          </div>
        </div>
      </div>
    );
  }
}

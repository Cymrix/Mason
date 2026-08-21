import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('mason_active_project_data');
      localStorage.removeItem('mason_active_project_id');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 select-text">
          <div className="max-w-xl w-full bg-neutral-900 border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <span className="text-2xl">⚠️</span>
              <h2 className="text-lg font-bold text-white">Something went wrong</h2>
            </div>
            
            <p className="text-xs text-neutral-300">
              An unexpected error occurred while rendering the workspace:
            </p>

            <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-xs font-mono text-red-300 overflow-x-auto whitespace-pre-wrap max-h-48">
              {this.state.error?.toString() || 'Unknown Error'}
              {this.state.errorInfo?.componentStack && (
                <div className="mt-2 text-neutral-500 text-[10px]">
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-600/30"
              >
                Reload App
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl text-xs font-bold transition"
              >
                Reset Stored Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

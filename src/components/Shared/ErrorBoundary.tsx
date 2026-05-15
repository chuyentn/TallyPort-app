import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-black text-[#0f4c75] dark:text-zinc-200 uppercase tracking-tight">Oops! Đã có lỗi xảy ra</h2>
          <p className="text-sm text-zinc-500 mt-2 max-w-md">
            Hệ thống gặp sự cố không mong muốn. Vui lòng làm mới trang hoặc thử lại sau.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-[#0f4c75] text-white rounded-xl font-bold hover:bg-[#1b9aaa] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

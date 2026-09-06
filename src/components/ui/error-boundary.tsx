"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <AlertTriangle className="mb-3 h-10 w-10 text-amber-500" />
          <h3 className="text-lg font-semibold">Something went wrong</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

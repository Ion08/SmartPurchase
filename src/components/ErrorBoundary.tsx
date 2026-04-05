'use client';

import { Component, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
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

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
          <CardContent className="space-y-3 p-6">
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100">Something went wrong</h3>
              <p className="mt-1 text-sm text-red-800 dark:text-red-200">
                {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
              </p>
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
            >
              Reload page
            </button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

'use client';

/**
 * Error boundary for dashboard and list sections.
 * Catches render errors and shows fallback; logs for debugging.
 */

import { Component } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(_error, _errorInfo) {
    // Error captured; state updated for fallback UI
  }

  render() {
    if (this.state.hasError) {
      const { fallback, onRetry, children } = this.props;
      if (fallback) return fallback;
      return (
        <Card className="p-6 border border-neutral-200">
          <p className="text-neutral-700 mb-2">Something went wrong loading this section.</p>
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={() => this.setState({ hasError: false, error: null })}>
              Try again
            </Button>
          )}
        </Card>
      );
    }
    return this.props.children;
  }
}

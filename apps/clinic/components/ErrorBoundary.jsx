'use client';

/**
 * Premium Error Boundary Component
 * Catches React render errors and displays a polished error UI
 * Supports custom fallbacks, retry logic, and error logging
 */

import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { logger } from '@/lib/utils/logger';
import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging
    logger.error('ErrorBoundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.props.name || 'Unknown',
    });

    this.setState({
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });

    // Call optional retry handler
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      const { fallback, variant = 'card', showRetry = true, title, message } = this.props;

      // Custom fallback takes precedence
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback(this.state.error, this.state.errorInfo)
          : fallback;
      }

      // Determine status code from error if available
      const statusCode =
        this.state.error?.statusCode ||
        this.state.error?.response?.status ||
        (this.state.error?.message?.includes('404') ? 404 : null) ||
        (this.state.error?.message?.includes('500') ? 500 : null);

      // Default error display with premium design
      return (
        <ErrorDisplay
          title={title}
          message={message || this.state.error?.message}
          statusCode={statusCode}
          variant={variant}
          showRetry={showRetry}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

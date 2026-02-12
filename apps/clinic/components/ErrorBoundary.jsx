'use client';

/**
 * Error Boundary – standard React error boundary.
 * Catches render/commit-phase errors and displays a consistent error UI.
 * Uses centralized error-handler for classification and user-facing messages.
 */

import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import {
  classifyError,
  getUserFriendlyMessage,
  handleComponentError,
  isChunkOrStaleError,
  tryChunkRecovery,
} from '@/lib/utils/error-handler';
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
    const name = this.props.name || 'Unknown';
    if (isChunkOrStaleError(error) && tryChunkRecovery()) return;
    handleComponentError(error, errorInfo, name);
    this.setState({ errorInfo });

    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (onErrorErr) {
        logger.error('ErrorBoundary onError callback threw', onErrorErr, {
          errorBoundary: name,
        });
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onRetry) {
      try {
        this.props.onRetry();
      } catch (err) {
        logger.error('ErrorBoundary onRetry callback threw', err);
      }
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { fallback, variant = 'card', showRetry = true, title, message } = this.props;
    const error = this.state.error;

    if (fallback) {
      return typeof fallback === 'function'
        ? fallback(error, this.state.errorInfo, this.handleRetry)
        : fallback;
    }

    const errorType = classifyError(error);
    const statusCode =
      error?.statusCode ??
      error?.response?.status ??
      (error?.message?.includes('404') ? 404 : null) ??
      (error?.message?.includes('500') ? 500 : null);

    const displayMessage =
      message ?? getUserFriendlyMessage(error, 'Something went wrong. Please try again.');
    const displayTitle = title ?? (statusCode === 404 ? 'Not found' : 'Something went wrong');

    return (
      <ErrorDisplay
        title={displayTitle}
        message={displayMessage}
        statusCode={statusCode}
        variant={variant}
        showRetry={showRetry}
        onRetry={this.handleRetry}
      />
    );
  }
}

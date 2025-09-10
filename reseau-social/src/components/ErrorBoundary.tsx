import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
interface Props {
  children?: ReactNode;
  fallback?: ReactNode; // Optional fallback UI
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || <div style={{ padding: '20px', textAlign: 'center', border: '1px solid red', margin: '20px' }}><h2>Oups! Quelque chose s'est mal passé.</h2><p>Nous sommes désolés pour le désagrément. Veuillez réessayer plus tard.</p>{this.state.error && <details style={{ whiteSpace: 'pre-wrap', textAlign: 'left', marginTop: '10px' }}>{this.state.error.message}<br />{this.state.error.stack}</details>}</div>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

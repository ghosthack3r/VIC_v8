import { Component, ErrorInfo, ReactNode } from 'react';
import { logRendererError } from './errorLogging';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    logRendererError('react:error-boundary', error, { componentStack: errorInfo.componentStack });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          background: '#0a0505',
          color: '#ff4d4d',
          fontFamily: 'monospace',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #ff4d4d',
          margin: '20px',
          clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)'
        }}>
          <h1 style={{ letterSpacing: '0.2em' }}>SYSTEM CRITICAL FAILURE</h1>
          <p style={{ opacity: 0.8 }}>The HUD renderer has encountered an unrecoverable error.</p>
          <pre style={{ 
            background: 'rgba(255,0,0,0.1)', 
            padding: '20px', 
            borderRadius: '4px',
            maxWidth: '800px',
            overflow: 'auto',
            border: '1px solid rgba(255,77,77,0.3)'
          }}>
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#ff4d4d',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              letterSpacing: '0.1em'
            }}
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

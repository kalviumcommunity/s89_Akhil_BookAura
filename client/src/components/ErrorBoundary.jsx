import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{
          padding: '20px',
          backgroundColor: '#fff8f8',
          border: '1px solid #ffcdd2',
          borderRadius: '8px',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#d32f2f' }}>Something went wrong</h2>
          <p>We're sorry, but there was an error loading the PDF viewer.</p>
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#A67C52',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Refresh Page
            </button>
          </div>
          {this.props.showDetails && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary>Error Details</summary>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                backgroundColor: '#f5f5f5', 
                padding: '10px', 
                borderRadius: '4px',
                fontSize: '12px',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

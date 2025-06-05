// Safe wrapper for JetSpeedTranslate with error boundary
import React from 'react';
import JetSpeedTranslate from './JetSpeedTranslate';

class JetSpeedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('JetSpeedTranslate Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          top: '50%',
          right: '20px',
          transform: 'translateY(-50%)',
          padding: '12px 16px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '200px',
          zIndex: 1000
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            Translation Unavailable
          </div>
          <div>
            The translation feature encountered an error. Please refresh the page to try again.
          </div>
        </div>
      );
    }

    return <JetSpeedTranslate {...this.props} />;
  }
}

const SafeJetSpeedTranslate = (props) => {
  try {
    return (
      <JetSpeedErrorBoundary>
        <JetSpeedTranslate {...props} />
      </JetSpeedErrorBoundary>
    );
  } catch (error) {
    console.error('Failed to load JetSpeedTranslate:', error);
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
        padding: '8px 12px',
        backgroundColor: '#d1ecf1',
        color: '#0c5460',
        border: '1px solid #bee5eb',
        borderRadius: '6px',
        fontSize: '11px',
        zIndex: 1000
      }}>
        Translation feature loading...
      </div>
    );
  }
};

export default SafeJetSpeedTranslate;

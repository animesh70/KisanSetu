import { Component, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';

class AppErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) { return { error }; }

  render() {
    if (this.state.error) {
      return <main style={{ margin: '40px auto', maxWidth: 620, padding: 24, fontFamily: 'system-ui' }}><h1>KisanSetu could not load</h1><p>Please refresh once. If this continues, the technical detail below will help us fix it.</p><pre style={{ whiteSpace: 'pre-wrap', color: '#9d3025' }}>{this.state.error.message}</pre></main>;
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(<StrictMode><AppErrorBoundary><App /></AppErrorBoundary></StrictMode>);

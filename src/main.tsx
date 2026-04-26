import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { isSupabaseConfigured } from './lib/supabase';
import ConfigError from './components/ConfigError';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);

if (!isSupabaseConfigured) {
  root.render(
    <React.StrictMode>
      <ConfigError />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}

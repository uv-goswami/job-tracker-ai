import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { JobProvider } from './context/JobContext';
import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';


const getSessionId = () => {
  let id = localStorage.getItem('jobai_session_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('jobai_session_id', id);
  }
  return id;
};


axios.defaults.headers.common['x-user-id'] = getSessionId();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <JobProvider>
      <App />
    </JobProvider>
  </React.StrictMode>,
)
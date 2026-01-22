import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, Search } from 'lucide-react';
import JobFeed from './pages/JobFeed';
import Dashboard from './pages/Dashboard';
import ResumeUpload from './components/ResumeUpload';
import SmartPopup from './components/SmartPopup';
import AIChat from './components/AIChat';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        {}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h1 className="logo">JobAi.</h1>
          </div>
          <nav className="nav-links">
            <NavLink to="/" icon={<Search size={20}/>} label="Find Jobs" />
            <NavLink to="/dashboard" icon={<LayoutDashboard size={20}/>} label="My Applications" />
            <ResumeUpload />
          </nav>
        </aside>

        {}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<JobFeed />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </main>

        {}
        <AIChat />
        <SmartPopup />
      </div>
    </BrowserRouter>
  );
}

const NavLink = ({ to, icon, label }) => (
  <Link to={to} className="nav-item">
    {icon}
    <span>{label}</span>
  </Link>
);

export default App;
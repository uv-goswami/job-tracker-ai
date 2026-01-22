import React, { useEffect, useState } from 'react';
import axios from 'axios';

const STATUS_OPTIONS = ['Applied', 'Interview', 'Offer', 'Rejected'];

const Dashboard = () => {
  const [apps, setApps] = useState([]);

  const fetchApps = () => {
    axios.get('/api/applications').then(res => setApps(res.data));
  };

  useEffect(() => {
    fetchApps();
    window.addEventListener('app-updated', fetchApps);
    return () => window.removeEventListener('app-updated', fetchApps);
  }, []);

  const handleStatusChange = async (jobId, newStatus) => {
    await axios.post('/api/applications/update', { jobId, newStatus });
    fetchApps();
  };

  return (
    <div>
      <h2 className="section-title">Application Tracker</h2>
      <div className="dashboard-grid">
        {apps.map((app) => (
          <div key={app.jobId} className="app-item">
            <div className="app-header">
                <div>
                    <h3 style={{ margin: 0 }}>{app.job.job_title}</h3>
                    <p style={{ margin: 0, color: '#6b7280' }}>{app.job.employer_name}</p>
                </div>
                <select 
                    value={app.status} 
                    onChange={(e) => handleStatusChange(app.jobId, e.target.value)}
                    className="status-select"
                >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            
            <div className="timeline">
                {app.history.map((h, i) => (
                    <div key={i} className="timeline-step">
                         <div className="dot-col">
                            <div className="dot"></div>
                         </div>
                         <div className="step-info">
                            <span className="step-stage">{h.stage}</span>
                            <span className="step-date">{new Date(h.date).toLocaleDateString()}</span>
                         </div>
                         {i < app.history.length - 1 && <div className="line"></div>}
                    </div>
                ))}
            </div>
          </div>
        ))}
        {apps.length === 0 && <p style={{ color: '#9ca3af', textAlign: 'center' }}>No applications yet.</p>}
      </div>
    </div>
  );
};

export default Dashboard;
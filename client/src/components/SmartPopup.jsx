import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const API_URL = '/api';

const SmartPopup = () => {
  const [pending, setPending] = useState(null);

  const checkPending = async () => {
    try {
      const res = await axios.get(`${API_URL}/track/pending`);
      if (res.data.pending) setPending(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    const onFocus = () => checkPending();
    window.addEventListener('focus', onFocus);
    checkPending();
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleResponse = async (status) => {
    await axios.post(`${API_URL}/track/confirm`, {
      jobId: pending.jobId,
      status
    });
    setPending(null);
    if (status !== 'Ignored') window.dispatchEvent(new Event('app-updated'));
  };

  if (!pending) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <h3 style={{ marginTop: 0 }}>Tracking Check</h3>
        <p style={{ color: '#4b5563', marginBottom: '24px' }}>
            Did you take action on <span style={{ color: '#4f46e5', fontWeight: 'bold' }}>{pending.job.job_title}</span>?
        </p>
        
        <div className="popup-actions">
          <button onClick={() => handleResponse('Applied')} className="btn-yes">
            <CheckCircle size={20} /> <span>Yes, I Applied</span>
          </button>
          
          <button onClick={() => handleResponse('Applied Earlier')} className="btn-earlier">
            <Clock size={20} /> <span>Applied Earlier</span>
          </button>
          
          <button onClick={() => handleResponse('Ignored')} className="btn-no">
            <XCircle size={20} /> <span>No, Just Browsing</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartPopup;
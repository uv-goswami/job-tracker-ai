import React from 'react';
import axios from 'axios';
import { Briefcase, MapPin, ExternalLink } from 'lucide-react';

const JobCard = ({ job, highlight }) => {
  const score = job.matchScore || 0;
  
  const getBadgeClass = (s) => {
    if (s >= 70) return 'match-badge badge-green';
    if (s >= 40) return 'match-badge badge-yellow';
    return 'match-badge badge-gray';
  };

  const handleApply = async () => {
    await axios.post('/api/track/click', { jobId: job.job_id });
    const link = job.job_apply_link || job.job_google_link || '#';
    window.open(link, '_blank');
  };

  return (
    <div className={`job-card ${highlight ? 'highlight' : ''}`}>
      <div className={getBadgeClass(score)}>
        {score}% Match
      </div>

      <div className="card-header">
        <h3>{job.job_title}</h3>
        <p>{job.employer_name}</p>
      </div>

      <div className="card-tags">
        <span className="tag"><MapPin size={12}/> {job.job_city || 'Remote'}</span>
        <span className="tag"><Briefcase size={12}/> {job.job_employment_type || 'Full-time'}</span>
      </div>

      {job.matchReason && (
        <div className="ai-reason">
          " {job.matchReason} "
        </div>
      )}

      <button onClick={handleApply} className="btn-apply">
        <span>Apply Now</span>
        <ExternalLink size={14} />
      </button>
    </div>
  );
};

export default JobCard;
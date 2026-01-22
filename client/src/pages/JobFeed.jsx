import React, { useEffect, useState } from 'react';
import axios from 'axios';
import JobCard from '../components/JobCard';
import { useJobContext } from '../context/JobContext';
import { Star } from 'lucide-react';

const JobFeed = () => {
  const { filters, updateFilters } = useJobContext();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/jobs', { params: filters });
        setJobs(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [filters]);

  const bestMatches = jobs.filter(j => j.matchScore >= 70).slice(0, 6);
  const otherJobs = jobs.filter(j => !bestMatches.includes(j));

  return (
    <div className="feed-layout">
      {}
      <aside className="filter-sidebar">
        <div className="filter-group">
            <label>Search</label>
            <input 
                className="input-field" 
                value={filters.query} 
                onChange={e => updateFilters({ query: e.target.value })} 
                placeholder="Job title..." 
            />
        </div>

        <div className="filter-group">
            <label>Skills (comma sep)</label>
            <input 
                className="input-field" 
                value={filters.skills} 
                onChange={e => updateFilters({ skills: e.target.value })} 
                placeholder="React, Node..." 
            />
        </div>

        <div className="filter-group">
            <label>Date Posted</label>
            <select className="select-field" value={filters.datePosted} onChange={e => updateFilters({ datePosted: e.target.value })}>
                <option value="ANY">Any time</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
            </select>
        </div>

        <div className="filter-group">
            <label>Job Type</label>
            <select className="select-field" value={filters.jobType} onChange={e => updateFilters({ jobType: e.target.value })}>
                <option value="ALL">All Types</option>
                <option value="FULLTIME">Full-time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Internship</option>
            </select>
        </div>

        <div className="checkbox-group">
            <input type="checkbox" checked={filters.remote} onChange={e => updateFilters({ remote: e.target.checked })} />
            <label>Remote Only</label>
        </div>
      </aside>

      {/* Main Content */}
      <div className="jobs-container">
        {loading ? <p>Analyzing jobs...</p> : (
            <>
                <h2 className="section-title">
                    <Star size={20} fill="#ca8a04" stroke="#ca8a04"/> Best Matches
                </h2>
                
                {bestMatches.length > 0 ? (
                    <div className="grid-jobs">
                        {bestMatches.map(job => <JobCard key={job.job_id} job={job} highlight />)}
                    </div>
                ) : (
                    <div className="no-match">No high matches found. Try updating your resume.</div>
                )}

                <h2 className="section-title">All Jobs</h2>
                <div className="grid-jobs">
                    {otherJobs.map(job => <JobCard key={job.job_id} job={job} />)}
                </div>
            </>
        )}
      </div>
    </div>
  );
};

export default JobFeed;
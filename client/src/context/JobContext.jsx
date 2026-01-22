import React, { createContext, useState, useContext } from 'react';

const JobContext = createContext();

export const JobProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    query: '',
    location: '',
    remote: false,
    jobType: 'ALL',
    datePosted: 'ANY',
    skills: '',
    minScore: 0
  });

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <JobContext.Provider value={{ filters, updateFilters }}>
      {children}
    </JobContext.Provider>
  );
};

export const useJobContext = () => useContext(JobContext);
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { FileUp } from 'lucide-react';

const ResumeUpload = () => {
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('resume', file);

    try {
      await axios.post('/api/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Resume Uploaded & Parsed!');
      window.location.reload(); 
    } catch (e) {
      alert('Upload failed');
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: {'application/pdf': ['.pdf'], 'text/plain': ['.txt']} });

  return (
    <div {...getRootProps()} className="upload-zone">
      <input {...getInputProps()} />
      <FileUp style={{ margin: '0 auto 8px auto', color: '#9ca3af' }} size={24} />
      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, fontWeight: 500 }}>Upload Resume (PDF)</p>
    </div>
  );
};

export default ResumeUpload;
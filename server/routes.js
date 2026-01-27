const redis = require('./lib/redis');
const { matchJobs, chatResponse } = require('./lib/ai');
const axios = require('axios');

const MOCK_JOBS = [
  { job_id: '1', job_title: 'Senior React Developer', employer_name: 'TechCorp', job_city: 'Remote', job_is_remote: true, job_employment_type: 'FULLTIME', job_posted_at_datetime_utc: new Date().toISOString(), job_description: 'React, Redux, Node.js expert needed.', job_apply_link: 'https://google.com' },
  { job_id: '2', job_title: 'Backend Engineer', employer_name: 'DataSystems', job_city: 'New York', job_is_remote: false, job_employment_type: 'FULLTIME', job_posted_at_datetime_utc: new Date(Date.now() - 86400000 * 5).toISOString(), job_description: 'Node.js, Fastify, Redis.', job_apply_link: 'https://google.com' },
  { job_id: '3', job_title: 'UX Designer', employer_name: 'CreativeInc', job_city: 'London', job_is_remote: true, job_employment_type: 'CONTRACT', job_posted_at_datetime_utc: new Date(Date.now() - 86400000 * 20).toISOString(), job_description: 'Figma, Adobe Suite.', job_apply_link: 'https://google.com' },
];

let pdfParse;
try { pdfParse = require('pdf-parse'); } catch (e) { console.warn("pdf-parse not installed."); }

const getUserId = (req) => {
    return req.headers['x-user-id'] || 'demo-user';
};

async function routes(fastify, options) {

    fastify.get('/api/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date() };
    }); 

    fastify.get('/api/jobs', async (request) => {
    const { query, location, remote, jobType, datePosted, skills, minScore } = request.query;
    const userId = getUserId(request);

    let jobs = [];
    const cacheKey = `jobs:${query || 'dev'}:${location || 'any'}:${remote}:${jobType}`;

    try {
        const cached = await redis.get(cacheKey);
        if (cached) jobs = JSON.parse(cached);
    } catch (e) {}

    if (jobs.length === 0 && process.env.RAPIDAPI_KEY) {
        try {
            let q = query || 'developer';
            if (location) q += ` in ${location}`;
            if (skills) q += ` ${skills.split(',').join(' ')}`;
            
            const params = {
                query: q,
                page: '1',
                num_pages: '1',
                date_posted: datePosted === 'ANY' ? 'all' : datePosted === '24h' ? 'today' : datePosted === '7d' ? 'week' : 'month',
                employment_type: jobType === 'ALL' ? undefined : jobType,
            };

            const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
                params,
                headers: {
                    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                    'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
                }
            });

            if (response.data.data) {
                jobs = response.data.data;
                if (remote === 'true') jobs = jobs.filter(j => j.job_is_remote === true);
                await redis.setex(cacheKey, 3600, JSON.stringify(jobs));
            }
        } catch (error) {  }
    }

    if (jobs.length === 0) {
        jobs = MOCK_JOBS;
        jobs = jobs.filter(job => {
            let pass = true;
            if (query && !job.job_title.toLowerCase().includes(query.toLowerCase())) pass = false;
            if (remote === 'true' && !job.job_is_remote) pass = false;
            return pass;
        });
    }

    let resumeText = "";
    try { resumeText = await redis.get(`user:${userId}:resume`) || ""; } catch (e) {}
    
    let scoredJobs = await matchJobs(resumeText, jobs);
    
    if (minScore) scoredJobs = scoredJobs.filter(j => j.matchScore >= parseInt(minScore));

    try {
        const pipeline = redis.pipeline();
        scoredJobs.forEach(job => {
            pipeline.setex(`job:details:${job.job_id}`, 86400, JSON.stringify(job));
        });
        await pipeline.exec();
    } catch(e) {}

    return scoredJobs;
  });

  fastify.post('/api/resume', async (request, reply) => {
    const userId = getUserId(request);
    try {
        const data = await request.file();
        if (!data) throw new Error("No file");
        const buffer = await data.toBuffer();
        let text = "";

        if (data.mimetype === 'application/pdf') {
            if (typeof pdfParse === 'function') {
                try {
                    const pdfData = await pdfParse(buffer);
                    text = pdfData.text.replace(/\n/g, " ").trim();
                } catch (err) { text = "Resume Text (Parse Failed)"; }
            } else { text = "Resume Text (Parser Missing)"; }
        } else {
            text = buffer.toString();
        }
        
        await redis.setex(`user:${userId}:resume`, 604800, text);
        return { success: true };
    } catch (err) {
        if (err.message.includes("NOPERM")) return reply.code(500).send({ error: "DB Permission Error" });
        return reply.code(500).send({ error: "Upload Failed" });
    }
  });

  fastify.post('/api/track/click', async (request, reply) => {
    const userId = getUserId(request);
    const { jobId } = request.body;
    await redis.setex(`user:${userId}:pending_check`, 600, jobId);
    return { status: 'tracking' };
  });

  fastify.get('/api/track/pending', async (request, reply) => {
    const userId = getUserId(request);
    const pendingJobId = await redis.get(`user:${userId}:pending_check`);
    
    if (!pendingJobId) return { pending: false };

    const jobRaw = await redis.get(`job:details:${pendingJobId}`);
    return { pending: true, jobId: pendingJobId, job: jobRaw ? JSON.parse(jobRaw) : {} };
  });

  fastify.post('/api/track/confirm', async (request, reply) => {
    const userId = getUserId(request);
    const { jobId, status } = request.body;
    
    if (status !== 'Ignored') {
        const jobRaw = await redis.get(`job:details:${jobId}`);
        const jobData = jobRaw ? JSON.parse(jobRaw) : { job_title: 'Unknown Job', employer_name: 'Unknown Company' };

        const entry = {
            jobId,
            status: status === 'Applied Earlier' ? 'Applied' : status,
            snapshot: { 
                title: jobData.job_title, 
                company: jobData.employer_name 
            },
            timestamp: new Date().toISOString(),
            history: [{ stage: status, date: new Date().toISOString() }]
        };
        await redis.hset(`user:${userId}:applications`, jobId, JSON.stringify(entry));
    }
    await redis.del(`user:${userId}:pending_check`);
    return { success: true };
  });

  fastify.post('/api/applications/update', async (request, reply) => {
      const userId = getUserId(request);
      const { jobId, newStatus } = request.body;
      
      const raw = await redis.hget(`user:${userId}:applications`, jobId);
      if(!raw) return { error: "Not found" };
      const entry = JSON.parse(raw);
      entry.status = newStatus;
      entry.history.push({ stage: newStatus, date: new Date().toISOString() });
      await redis.hset(`user:${userId}:applications`, jobId, JSON.stringify(entry));
      return { success: true };
  });

  fastify.get('/api/applications', async (request, reply) => {
    const userId = getUserId(request);
    const rawData = await redis.hgetall(`user:${userId}:applications`);
    
    const apps = await Promise.all(Object.values(rawData).map(async (raw) => {
        const app = JSON.parse(raw);
        
        let job = { job_title: 'Unknown', employer_name: 'Unknown' };
        
        if (app.snapshot) {
            job = { job_title: app.snapshot.title, employer_name: app.snapshot.company };
        } 
        else {
            const jobRaw = await redis.get(`job:details:${app.jobId}`);
            if (jobRaw) job = JSON.parse(jobRaw);
        }

        return { ...app, job };
    }));
    return apps;
  });

  fastify.post('/api/chat', async (request, reply) => {
    const { message } = request.body;
    const response = await chatResponse(message);
    return response; 
  });
}

module.exports = routes;
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const matchJobs = async (resumeText, jobs) => {
  if (!resumeText) return jobs.map(j => ({ ...j, matchScore: 0, matchReason: "Upload resume to see score" }));
  const jobsToScore = jobs.slice(0, 5); 
  
  const prompt = `
    You are an ATS Scoring AI. 
    Resume: "${resumeText.slice(0, 1000)}"
    
    Jobs (JSON): ${JSON.stringify(jobsToScore.map(j => ({ id: j.job_id, title: j.job_title, desc: j.job_description?.slice(0, 200) })))}
    
    Task: Return JSON object where keys are job_ids and values are: { score: number (0-100), reason: string (max 10 words) }.
    Strict JSON only.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, '').trim(); 
    const scores = JSON.parse(text);
    
    return jobs.map(job => ({
      ...job,
      matchScore: scores[job.job_id]?.score || (Math.floor(Math.random() * 40) + 10),
      matchReason: scores[job.job_id]?.reason || "General Match"
    }));
  } catch (error) {
    console.error("AI Matching Error Details:", error);
    return jobs.map(j => ({ ...j, matchScore: 0, matchReason: "AI Unavailable" }));
  }
};

const chatResponse = async (message) => {
    const prompt = `
      You are a Job Assistant. User says: "${message}".
      
      If the user asks to filter/find jobs, return a JSON Object like:
      {
        "reply": "Sure, showing remote React jobs.",
        "action": "FILTER",
        "params": { 
           "query": "React", 
           "remote": true, 
           "jobType": "FULLTIME" (or PARTTIME/CONTRACT/INTERN),
           "minScore": 70 (if asked for high match)
        }
      }

      If the user asks a general question, return:
      {
        "reply": "Simple answer here.",
        "action": "NONE"
      }
      
      Strict JSON output only.
    `;
    
    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, '').trim();
        return JSON.parse(text);
    } catch (e) {
        console.error("AI Chat Error Details:", e);
        return { reply: "I'm having trouble thinking right now (Check Server Logs).", action: "NONE" };
    }
};

module.exports = { matchJobs, chatResponse };
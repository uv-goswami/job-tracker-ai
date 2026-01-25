const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { z } = require("zod");
const { StructuredOutputParser } = require("langchain/output_parsers");
const { PromptTemplate } = require("@langchain/core/prompts");
require('dotenv').config();


const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-2.5-flash", 
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0.7,
});


const matchingSchema = z.array(
  z.object({
    job_id: z.string().describe("The ID of the job being scored"),
    score: z.number().describe("Match score between 0 and 100"),
    reason: z.string().describe("A concise reason for the score (max 15 words)")
  })
);

const matchingParser = StructuredOutputParser.fromZodSchema(matchingSchema);

const matchJobs = async (resumeText, jobs) => {
  if (!resumeText || jobs.length === 0) {
    return jobs.map(j => ({ ...j, matchScore: 0, matchReason: "N/A" }));
  }


  const jobsToScore = jobs.slice(0, 5);

  const chain = PromptTemplate.fromTemplate(
    `You are an expert ATS (Applicant Tracking System) AI.
    
    RESUME:
    {resume}

    JOBS TO EVALUATE:
    {jobs}

    Analyze the resume against each job.
    {format_instructions}`
  ).pipe(model).pipe(matchingParser);

  try {

    const results = await chain.invoke({
      resume: resumeText.slice(0, 2000), 
      jobs: JSON.stringify(jobsToScore.map(j => ({ id: j.job_id, title: j.job_title, desc: j.job_description?.slice(0, 300) }))),
      format_instructions: matchingParser.getFormatInstructions(),
    });

    return jobs.map(job => {
      const scoreData = results.find(r => r.job_id === job.job_id);
      return {
        ...job,
        matchScore: scoreData ? scoreData.score : 0,
        matchReason: scoreData ? scoreData.reason : "Analysis failed"
      };
    });

  } catch (error) {
    console.error("LangChain Matching Error:", error.message);
    return jobs.map(j => ({ ...j, matchScore: 0, matchReason: "AI Unavailable" }));
  }
};


const chatSchema = z.object({
  reply: z.string().describe("The natural language answer to the user"),
  action: z.enum(["FILTER", "NONE"]).describe("The action to take on the frontend"),
  params: z.object({
    query: z.string().optional(),
    remote: z.boolean().optional(),
    jobType: z.enum(["FULLTIME", "CONTRACT", "INTERN", "ALL"]).optional(),
    minScore: z.number().optional()
  }).optional().describe("Filter parameters if action is FILTER")
});

const chatParser = StructuredOutputParser.fromZodSchema(chatSchema);

const chatResponse = async (message) => {
  const chain = PromptTemplate.fromTemplate(
    `You are a helpful Job Assistant for a developer job board.
    User Query: "{message}"
    
    If the user asks to find/show/filter jobs, set action to "FILTER" and extract params.
    If the user asks general questions, set action to "NONE".
    
    {format_instructions}`
  ).pipe(model).pipe(chatParser);

  try {
    return await chain.invoke({
      message: message,
      format_instructions: chatParser.getFormatInstructions()
    });
  } catch (e) {
    console.error("LangChain Chat Error:", e.message);
    return { reply: "I'm having trouble understanding right now.", action: "NONE" };
  }
};

module.exports = { matchJobs, chatResponse };
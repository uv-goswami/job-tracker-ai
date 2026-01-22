# AI-Powered Job Tracker

**Live Deployment (Render):** [https://job-tracker-ui-79a8.onrender.com/](https://job-tracker-ui-79a8.onrender.com/)

## Overview

A full-stack intelligent job tracking system that integrates real-time job searching, AI-driven resume matching, and automated application status tracking. The system utilizes a "Smart Backend" architecture where state transitions are managed via Redis, ensuring data consistency and scalability.

---

## Architecture

The application follows a client-server architecture with a stateless REST API and a high-performance in-memory data store.

![01](diagrams/01.svg)

### Key Components

1. **Frontend:** React (Vite) with Context API for state management. Acts as a presentation layer that reacts to server-side state.
2. **Backend:** Fastify (Node.js) handling business logic, API proxying, and session management.
3. **Database:** Redis (Upstash) used for:
* Session storage (Resumes, User IDs).
* Job Caching (1-hour TTL).
* Application State Machine (Pending/Applied statuses).
4. **AI Engine:** Google Gemini Flash 2.5 for resume scoring and natural language chat interactions.

---

## Directory Structuree

```
job-tracker-ai/
├── client/                
│   ├── public/
│   ├── src/
│   │   ├── components/     
│   │   │   ├── AIChat.jsx
│   │   │   ├── JobCard.jsx
│   │   │   ├── ResumeUpload.jsx
│   │   │   └── SmartPopup.jsx
│   │   ├── context/        
│   │   │   └── JobContext.jsx
│   │   ├── pages/          
│   │   │   ├── Dashboard.jsx
│   │   │   └── JobFeed.jsx
│   │   ├── App.jsx        
│   │   ├── main.jsx       
│   │   └── index.css       
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                
│   ├── lib/               
│   │   ├── ai.js          
│   │   └── redis.js      
│   ├── routes.js           
│   ├── server.js          
│   ├── Dockerfile         
│   ├── .dockerignore
│   ├── .env                
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Setup Instructions

### Prerequisites

* Node.js v18 or higher
* Redis Instance (Upstash recommended)
* Google Gemini API Key
* RapidAPI Key (JSearch)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/uv-goswami/job-tracker-ai
cd job-tracker-ai

```


2. **Backend Setup**
```bash
cd server
npm install

```


Create a `.env` file in the `server` directory:
```env
PORT=3000
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_UPSTASH_URL
GEMINI_API_KEY=YOUR_GEMINI_KEY
RAPIDAPI_KEY=YOUR_RAPIDAPI_KEY

```


Start the server:
```bash
node server.js

```


3. **Frontend Setup**
Open a new terminal:
```bash
cd client
npm install
npm run dev

```
---
<br>


## AI Matching Logic

The matching system is designed to be deterministic and efficient. It does not rely on simple keyword matching but uses LLM-based semantic analysis.

![02](diagrams/02.svg)

**Approach:**

1. **Extraction:** The user's resume is parsed from PDF to raw text upon upload and stored in Redis with a 7-day TTL.
2. **Contextualization:** When fetching jobs, we send the resume text + a batch of 5-10 job descriptions to Gemini.
3. **Prompt Engineering:** The AI is instructed to act as an ATS (Applicant Tracking System) and return a strict JSON object containing a numerical score (0-100) and a concise reason (max 10 words) for the match.
4. **Efficiency:** Scores are cached in Redis to prevent redundant API calls on page reloads.

## Critical Thinking: Smart Popup Flow

The core challenge was tracking "external" actions (applying on a third-party site) without disrupting the user experience. We implemented a Backend State Machine to handle this.

**The Problem:** We cannot know if a user successfully submitted an application on an external site.
**The Solution:** We track the *intent* to apply and verify it upon the user's return.

![03](diagrams/03.svg)

**Edge Cases Handled:**

1. **TTL Expiration:** If the user keeps the tab open for >10 minutes without returning, the pending key expires, preventing a stale popup from appearing days later.
2. **Multiple Tabs:** The state is tied to the user session ID, ensuring actions in one tab don't confuse another session.
3. **Data Persistence:** Job details are snapshotted into the application history. If the job listing expires from the cache, the dashboard still retains the correct job title and company name.

## Scalability Considerations

1. **O(1) Data Structures:** Application history is stored using Redis Hashes (`HSET`). Reading or updating a specific application status is an O(1) operation, regardless of whether the user has 10 or 10,000 applications.
2. **Stateless API:** The Node.js backend does not hold local state. User sessions are identified via headers and stored in Redis. This allows the backend to be horizontally scaled (e.g., spun up on multiple containers) without synchronization issues.
3. **TTL Management:**
* **Resumes:** Expire in 7 days to manage storage costs.
* **Job Details:** Expire in 24 hours to ensure fresh data.
* **Pending Actions:** Expire in 10 minutes to prevent UI glitches.



## Tradeoffs & Limitations

1. **Mock Data Fallback:** The application uses a hybrid fetching strategy. If the JSearch API quota is exceeded or fails, it seamlessly falls back to mock data. In a production environment, a paid API tier with higher rate limits would be required.
2. **AI Latency:** Scoring 10+ jobs in real-time can take 2-3 seconds.
    * *Improvement:* Move scoring to a background worker queue (e.g., BullMQ) and stream results via WebSockets.


3. **Session Security:** Currently, user identification relies on a client-generated ID stored in LocalStorage.
    * *Improvement:* Implement proper Authentication (OAuth/JWT) to secure user data across devices.

---

# Screenshots

**Jobs:**
![ss1](diagrams/ss1.png)

**Resume Upload**
![resume](diagrams/reume.png)

**AI Chat**
![Ai](diagrams/Ai.png)

**Pop Up after checking Job**
![popup](diagrams/popup.png)
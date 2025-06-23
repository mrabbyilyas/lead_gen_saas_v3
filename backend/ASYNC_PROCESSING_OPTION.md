# Async Processing Alternative for Gemini API

## Overview
If Azure App Service timeout limits persist despite configuration changes, this async processing approach eliminates timeout issues by returning immediate responses and processing Gemini requests in the background.

## How It Works

### 1. Immediate Response Pattern
```
POST /companies/search/async
→ Returns immediately with job_id
→ Gemini processing happens in background
→ Client polls for completion
```

### 2. API Endpoints

#### Start Async Search
```
POST /companies/search/async
{
  "company_name": "TikTok"
}

Response:
{
  "job_id": "search_12345",
  "status": "processing",
  "estimated_completion": "2025-06-23T08:05:00Z"
}
```

#### Check Status
```
GET /companies/search/status/{job_id}

Response (Processing):
{
  "job_id": "search_12345",
  "status": "processing",
  "progress": "Analyzing company data...",
  "estimated_completion": "2025-06-23T08:05:00Z"
}

Response (Complete):
{
  "job_id": "search_12345",
  "status": "completed",
  "result": {
    "id": 123,
    "company_name": "TikTok",
    "analysis_result": { ... }
  }
}
```

## Implementation Strategy

### Database Schema
Add `async_jobs` table:
```sql
CREATE TABLE async_jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(255) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'processing',
    result JSONB NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE NULL
);
```

### Background Processing
- Use Python's `threading` or `asyncio` for background tasks
- Store job status in database
- Update progress as Gemini analysis proceeds

## Benefits
- ✅ No timeout issues (immediate response)
- ✅ Better user experience with progress updates
- ✅ Scalable for multiple concurrent requests
- ✅ Works within Azure's timeout constraints

## Fallback Strategy
- Keep current synchronous endpoint for quick responses
- Add async endpoints for complex analysis
- Let frontend choose based on expected processing time

## Frontend Integration
```javascript
// Start async search
const response = await api.post('/companies/search/async', { company_name: 'TikTok' });
const jobId = response.data.job_id;

// Poll for completion
const checkStatus = async () => {
  const status = await api.get(`/companies/search/status/${jobId}`);
  if (status.data.status === 'completed') {
    // Show results
    displayResults(status.data.result);
  } else if (status.data.status === 'processing') {
    // Show progress, poll again in 5 seconds
    setTimeout(checkStatus, 5000);
  }
};
```

This approach provides a robust fallback if Azure timeout limits cannot be fully resolved through configuration alone.
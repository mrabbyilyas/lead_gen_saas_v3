# Async API Usage Guide

## Overview
The async API endpoints solve the Azure App Service timeout issues by returning immediate responses and processing Gemini AI analysis in the background.

## How It Works

### 1. Start Async Search
**Endpoint:** `POST /companies/search/async`
**Returns:** Immediate response (< 1 second) with job_id

```bash
curl -X POST https://your-app.azurewebsites.net/companies/search/async \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"company_name": "Samsung"}'
```

**Response:**
```json
{
  "job_id": "job_a1b2c3d4e5f6",
  "status": "processing",
  "progress_message": "Starting company analysis...",
  "created_at": "2025-06-23T08:20:00Z",
  "estimated_completion": "2025-06-23T08:25:00Z"
}
```

### 2. Check Job Status
**Endpoint:** `GET /companies/jobs/{job_id}/status`
**Returns:** Current status and progress

```bash
curl -X GET https://your-app.azurewebsites.net/companies/jobs/job_a1b2c3d4e5f6/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (Processing):**
```json
{
  "job_id": "job_a1b2c3d4e5f6",
  "status": "processing",
  "progress_message": "Generating AI analysis with Gemini...",
  "created_at": "2025-06-23T08:20:00Z",
  "completed_at": null
}
```

**Response (Completed):**
```json
{
  "job_id": "job_a1b2c3d4e5f6",
  "status": "completed",
  "progress_message": "Analysis completed successfully",
  "result": {
    "id": 123,
    "company_name": "Samsung",
    "canonical_name": "Samsung Electronics Co., Ltd.",
    "analysis_result": { ... },
    "status": "success",
    "created_at": "2025-06-23T08:24:30Z"
  },
  "created_at": "2025-06-23T08:20:00Z",
  "completed_at": "2025-06-23T08:24:30Z"
}
```

**Response (Failed):**
```json
{
  "job_id": "job_a1b2c3d4e5f6",
  "status": "failed",
  "progress_message": "Analysis failed",
  "error_message": "Gemini API error: Unable to find information for this company",
  "created_at": "2025-06-23T08:20:00Z",
  "completed_at": "2025-06-23T08:22:00Z"
}
```

## Frontend Integration Example

```javascript
// Start async search
async function searchCompanyAsync(companyName) {
  const response = await fetch('/companies/search/async', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ company_name: companyName })
  });
  
  const job = await response.json();
  
  // Show immediate feedback
  showProgress(`Analysis started for ${companyName}`, job.job_id);
  
  // Start polling
  pollJobStatus(job.job_id);
}

// Poll for completion
async function pollJobStatus(jobId) {
  const checkStatus = async () => {
    try {
      const response = await fetch(`/companies/jobs/${jobId}/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const status = await response.json();
      
      updateProgress(status.progress_message);
      
      if (status.status === 'completed') {
        showResults(status.result);
      } else if (status.status === 'failed') {
        showError(status.error_message);
      } else {
        // Still processing, check again in 5 seconds
        setTimeout(checkStatus, 5000);
      }
    } catch (error) {
      showError('Error checking job status');
    }
  };
  
  checkStatus();
}
```

## Benefits

✅ **No Timeout Issues**: Immediate response eliminates all Azure timeout problems
✅ **Better UX**: Progress updates keep users informed
✅ **Scalable**: Multiple concurrent analyses without blocking
✅ **Reliable**: Works within Azure App Service constraints
✅ **Backward Compatible**: Original `/companies/search` endpoint still available

## API Status Codes

- **200**: Success (job created or status retrieved)
- **400**: Bad request (invalid company name)
- **401**: Unauthorized (invalid token)
- **404**: Job not found
- **500**: Internal server error

## Job Lifecycle

1. **processing**: Job started, analysis in progress
2. **completed**: Analysis finished successfully
3. **failed**: Analysis failed with error

## Testing the Async Flow

1. **Generate Token**: `POST /auth/token`
2. **Start Async Search**: `POST /companies/search/async`
3. **Poll Status**: `GET /companies/jobs/{job_id}/status` (every 5 seconds)
4. **Get Results**: Status will show "completed" with full analysis results

This completely eliminates the 502 Bad Gateway timeout issues you were experiencing!
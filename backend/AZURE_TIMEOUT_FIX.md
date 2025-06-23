# Azure Timeout Fix for Gemini API Search

## Problem
The `/companies/search` endpoint is returning 502 Bad Gateway errors on Azure App Service due to timeout issues. Gemini API calls take 1-5 minutes but Azure has shorter default timeouts.

## Solution Applied

### 1. Updated Gunicorn Configuration
✅ **Already Done**: Updated `startup.sh` with:
- Increased timeout from 120s to 600s (10 minutes)
- Added keep-alive and other performance settings

### 2. Required Azure App Service Settings
🔧 **You Need to Add These** in Azure Portal → App Service → Configuration → Application Settings:

```
WEBSITES_CONTAINER_START_TIME_LIMIT = 1800
SCM_COMMAND_IDLE_TIMEOUT = 1800
```

## How to Add Azure Settings

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your App Service (leadintel-backend-mvp)
3. Go to **Configuration** → **Application settings**
4. Click **+ New application setting**
5. Add the two settings above

## After Making Changes

1. **Save** the configuration
2. **Restart** the App Service
3. Wait for deployment to complete
4. Test the `/companies/search` endpoint

## Testing
After the fix, test with:
```bash
curl -X POST https://your-app.azurewebsites.net/companies/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"company_name": "TikTok"}'
```

## Expected Behavior
- Request may take 1-5 minutes (this is normal for Gemini AI)
- Should return 200 OK with company analysis data
- No more 502 Bad Gateway errors

## Monitoring
Monitor the request in Azure:
- App Service → Log stream (to see real-time logs)
- Application Insights → Live metrics (if enabled)

## Rollback Plan
If issues occur, you can revert the Gunicorn timeout back to 120s in `startup.sh` and redeploy.
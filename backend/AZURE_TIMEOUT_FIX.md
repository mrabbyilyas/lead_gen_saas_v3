# Azure Container Restart & Token Loss Fix

## Problem
The `/companies/search` endpoint is returning 502 Bad Gateway errors AND tokens become invalid after 20-30 seconds. This is caused by:
1. Azure App Service restarting containers during long Gemini API calls
2. Tokens stored in-memory get lost when container restarts

## Solution Applied

### 1. Updated Gunicorn Configuration
✅ **Already Done**: Updated `startup.sh` with:
- Increased timeout from 120s to 600s (10 minutes)
- Added keep-alive and other performance settings

### 2. Database Token Storage (CRITICAL FIX)
✅ **Already Done**: Replaced in-memory token storage with database storage:
- Added `AccessToken` table to store tokens in PostgreSQL
- Tokens now survive container restarts
- Updated all auth functions to use database

### 3. Required Azure App Service Settings
🔧 **You Need to Add These** in Azure Portal → App Service → Configuration → Application Settings:

```
WEBSITES_CONTAINER_START_TIME_LIMIT = 1800
SCM_COMMAND_IDLE_TIMEOUT = 1800
WEBSITES_ENABLE_APP_SERVICE_STORAGE = true
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
4. **Database Migration**: The new `access_tokens` table will be created automatically on startup
5. Test the `/companies/search` endpoint

## Database Migration
The new token storage system will automatically:
- Create the `access_tokens` table in your PostgreSQL database
- Migrate existing functionality to use database storage
- Clean up expired tokens properly

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
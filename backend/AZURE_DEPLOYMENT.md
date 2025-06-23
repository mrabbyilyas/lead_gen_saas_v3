# Azure App Service Deployment Guide - LeadIntel Backend

## Prerequisites
- Azure Student Account with credits
- Azure CLI installed locally (optional)
- GitHub repository with backend code

## Azure App Service Configuration

### 1. Create App Service
1. Go to [Azure Portal](https://portal.azure.com)
2. Create Resource → Web App
3. Configure basic settings:
   - **Resource Group**: Create new or use existing
   - **Name**: `leadintel-backend-mvp` (must be globally unique)
   - **Runtime Stack**: Python 3.11
   - **Operating System**: Linux
   - **Pricing Plan**: Basic B1 (sufficient for MVP, $12.41/month)

### 2. Deployment Configuration
**Deployment Center** → GitHub:
- Connect your GitHub account
- Select repository and branch (`main`)
- **Root Directory**: `backend`
- Azure will auto-detect Python and create GitHub Actions workflow

### 3. Environment Variables
In **Configuration** → **Application Settings**, add:

```
# Database Configuration
DATABASE_HOST=leadgen-mvp-db.postgres.database.azure.com
DATABASE_NAME=postgres
DATABASE_PORT=5432
DATABASE_USER=lead_gen_admin
DATABASE_PASSWORD=VFBZ$dPcrI)QyAag

# Authentication
CLIENT_ID=rabby_lead_gen_mvp_test
CLIENT_SECRET=egqCnbS%!IsPY)Qk8nWJkSEE

# Gemini AI
GEMINI_API_KEY=AIzaSyDP0JRr1hmzPPTPsmPyxeIOZoSjSLLqOzA

# Application Settings
DEBUG=false
LOG_LEVEL=INFO
PORT=8000

# Azure-specific
SCM_DO_BUILD_DURING_DEPLOYMENT=true
ENABLE_ORYX_BUILD=true

# Timeout Configuration (Required for Gemini API calls)
WEBSITES_CONTAINER_START_TIME_LIMIT=1800
SCM_COMMAND_IDLE_TIMEOUT=1800
```

### 4. Startup Configuration
**Configuration** → **General Settings**:
- **Startup Command**: `/home/site/wwwroot/startup.sh`
- **Always On**: Enabled (prevents cold starts)

### 5. CORS Configuration
**CORS** settings to allow frontend access:
```
https://your-vercel-app.vercel.app
http://localhost:3000
```
- **Allow Credentials**: Yes

## Custom Domain & SSL
1. **Default Domain**: `leadintel-backend-mvp.azurewebsites.net`
2. **Custom Domain**: Configure in App Service → Custom domains
3. **SSL**: Free managed certificate available

## Monitoring & Logging
1. **Application Insights**: Enable for monitoring
2. **Log Stream**: View real-time logs
3. **Metrics**: Monitor CPU, memory, requests

## Database Connection
- App Service connects to existing Azure PostgreSQL
- Connection string built from environment variables
- SSL required for security

## GitHub Actions Workflow
Azure creates `.github/workflows/main_leadintel-backend-mvp.yml`:
```yaml
name: Build and deploy Python app to Azure Web App

on:
  push:
    branches: [ main ]
    paths: [ 'backend/**' ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r backend/requirements.txt
    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'leadintel-backend-mvp'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: backend/
```

## Testing Deployment
After deployment, test endpoints:
```bash
# Health check
curl https://leadintel-backend-mvp.azurewebsites.net/

# API documentation
https://leadintel-backend-mvp.azurewebsites.net/docs

# Company search
curl -X POST https://leadintel-backend-mvp.azurewebsites.net/companies/search \
  -H "Content-Type: application/json" \
  -d '{"company_name": "Microsoft"}'
```

## Security Considerations
- All environment variables encrypted at rest
- HTTPS enforced automatically
- Database connection uses SSL
- CORS configured for specific domains only

## Cost Estimation (Azure Student Credits)
- **App Service Basic B1**: ~$12.41/month
- **Application Insights**: Free tier (5GB/month)
- **Outbound Data Transfer**: First 5GB free
- **Total Estimated**: $12-15/month from student credits

## Timeout Configuration for Gemini API

The `/companies/search` endpoint uses Gemini AI which can take 1-5 minutes to complete. The following timeout settings are required:

### Required Azure App Service Settings:
```
WEBSITES_CONTAINER_START_TIME_LIMIT=1800  # 30 minutes container start timeout
SCM_COMMAND_IDLE_TIMEOUT=1800            # 30 minutes idle timeout
```

### Gunicorn Configuration:
The `startup.sh` script is configured with:
- `--timeout 600` (10 minutes worker timeout)
- `--keep-alive 10` (connection keep-alive)
- `--preload` (preload application for better performance)

### Important Notes:
- Other API endpoints (health, auth, get company by ID) remain fast
- Only the search endpoint requires extended timeout
- Azure App Service has a maximum timeout of 30 minutes for HTTP requests
- Monitor logs during Gemini API calls to ensure proper operation

## Troubleshooting
1. **502 Bad Gateway on Search**: Check timeout configuration above
2. **Deployment Fails**: Check GitHub Actions logs
3. **Environment Variables**: Verify in App Service Configuration
4. **Database Connection**: Test connection strings
5. **Logs**: Use Log Stream for real-time debugging
6. **Cold Starts**: Enable "Always On" setting
7. **Gemini Timeout**: Verify `WEBSITES_CONTAINER_START_TIME_LIMIT` and `SCM_COMMAND_IDLE_TIMEOUT` are set

## Performance Optimization
- **Always On**: Prevents cold starts
- **Auto-scaling**: Configure based on CPU/memory
- **CDN**: Optional for static content
- **Connection Pooling**: Handled by SQLAlchemy

## Production Checklist
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] Always On enabled
- [ ] SSL certificate active
- [ ] Application Insights enabled
- [ ] Database connection tested
- [ ] Frontend integration verified
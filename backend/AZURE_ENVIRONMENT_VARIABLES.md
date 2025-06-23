# Azure App Service Environment Variables Configuration

## Required Environment Variables for Azure Deployment

Set these environment variables in your Azure App Service configuration:

### Database Configuration
```
DATABASE_HOST=leadgen-mvp-db.postgres.database.azure.com
DATABASE_NAME=postgres
DATABASE_PORT=5432
DATABASE_USER=lead_gen_admin
DATABASE_PASSWORD=VFBZ$dPcrI)QyAag
```

### Authentication Configuration
```
CLIENT_ID=rabby_lead_gen_mvp_test
CLIENT_SECRET=egqCnbS%!IsPY)Qk8nWJkSEE
TOKEN_EXPIRE_HOURS=24
```

### Gemini AI Configuration
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### Application Configuration
```
DEBUG=false
LOG_LEVEL=INFO
```

## How to Set Environment Variables in Azure App Service

### Method 1: Azure Portal
1. Go to Azure Portal → Your App Service
2. Navigate to **Settings** → **Environment variables**
3. Add each variable as **Name** and **Value**
4. Click **Apply** to save changes
5. Restart the App Service

### Method 2: Azure CLI
```bash
az webapp config appsettings set --name your-app-name --resource-group your-resource-group --settings \
  DATABASE_HOST=leadgen-mvp-db.postgres.database.azure.com \
  DATABASE_NAME=postgres \
  DATABASE_PORT=5432 \
  DATABASE_USER=lead_gen_admin \
  DATABASE_PASSWORD="VFBZ$dPcrI)QyAag" \
  CLIENT_ID=rabby_lead_gen_mvp_test \
  CLIENT_SECRET="egqCnbS%!IsPY)Qk8nWJkSEE" \
  TOKEN_EXPIRE_HOURS=24 \
  DEBUG=false \
  LOG_LEVEL=INFO
```

## Testing Database Connection

After setting environment variables:

1. **Restart Azure App Service**
2. **Test health endpoint**: `GET https://your-app.azurewebsites.net/health`
3. **Check logs**: Monitor Azure App Service logs for database connection status
4. **Test database endpoints**: 
   - `GET /api/stats` should return JSON
   - `GET /api/companies` should return JSON

## Troubleshooting

### If database connection fails:
1. Check Azure PostgreSQL firewall rules
2. Verify connection string format
3. Ensure Azure App Service can reach PostgreSQL
4. Check Azure App Service logs for specific error messages

### If environment variables aren't loaded:
1. Verify variables are set in Azure portal
2. Restart the App Service
3. Check if dotenv is loading properly in production
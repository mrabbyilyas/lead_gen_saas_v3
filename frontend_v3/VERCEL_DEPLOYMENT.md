# Vercel Deployment Guide - LeadIntel Frontend

## Prerequisites
- Vercel account (free tier sufficient for MVP)
- GitHub repository connected to Vercel
- Environment variables ready

## Deployment Steps

### 1. Connect Repository to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select "frontend_v3" as the root directory

### 2. Configure Build Settings
Vercel should auto-detect Next.js, but verify:
- **Framework Preset**: Next.js
- **Root Directory**: `frontend_v3`
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (auto-detected)

### 3. Environment Variables Setup
In Vercel Dashboard → Project → Settings → Environment Variables, add:

```
# Database Configuration
DB_HOST=leadgen-mvp-db.postgres.database.azure.com
DB_NAME=postgres
DB_PORT=5432
DB_USER=lead_gen_admin
DB_PASSWORD_ENCODED=VkZCWiRkUGNySSlReUFhZw==

# Authentication Configuration
AUTH_CLIENT_ID=rabby_lead_gen_mvp_test
AUTH_CLIENT_SECRET=egqCnbS%!IsPY)Qk8nWJkSEE

# Backend API URL (update after Azure backend deployment)
NEXT_PUBLIC_API_BASE_URL=https://your-azure-backend.azurewebsites.net

# Environment
NODE_ENV=production
```

### 4. Domain Configuration
1. **Automatic Domain**: Vercel provides `your-project.vercel.app`
2. **Custom Domain** (optional): Configure in Project Settings
3. **SSL**: Automatically enabled by Vercel

### 5. Deployment Commands
```bash
# Automatic deployment (recommended)
git push origin main

# Manual deployment via CLI
npx vercel --prod
```

## Post-Deployment Configuration

### Update Backend CORS
Once deployed, update your Azure backend CORS settings to include:
- `https://your-project.vercel.app`
- Your custom domain (if configured)

### Environment Variables for Production
- All sensitive variables are server-side only
- `NEXT_PUBLIC_` prefixed variables are exposed to browser
- Current setup keeps all credentials server-side

## Troubleshooting

### Build Issues
```bash
# Test build locally first
npm run build
npm run start
```

### Environment Variable Issues
- Check Vercel Dashboard → Project → Settings → Environment Variables
- Ensure no typos in variable names
- Redeploy after adding new variables

### Database Connection Issues
- Verify Azure PostgreSQL allows connections from Vercel IPs
- Check connection string format
- Test with `/api/debug/env` endpoint (remove in production)

## Performance Optimization
- Static pages are automatically optimized
- API routes run on Vercel Edge Functions
- Images automatically optimized with Next.js Image component

## Monitoring
- View deployment logs in Vercel Dashboard
- Function logs available for debugging
- Set up Vercel Analytics (optional)

## Security Notes
- Environment variables are encrypted at rest
- Server-side API routes protect sensitive operations
- HTTPS enforced automatically
- Remove debug endpoints before production

## Cost Expectations
- **Free Tier**: 100GB bandwidth, sufficient for MVP
- **Function Execution**: 100GB-hrs free monthly
- **Build Time**: 100 hours free monthly
- Upgrade to Pro if limits exceeded
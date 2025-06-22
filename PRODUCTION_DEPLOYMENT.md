# LeadIntel SaaS - Production Deployment Guide

## 🚀 Complete Deployment Strategy
**Frontend**: Vercel (Next.js optimized hosting)  
**Backend**: Azure App Service (Python/FastAPI)  
**Database**: Azure PostgreSQL (existing)

## ⚡ Quick Start Checklist

### Prerequisites ✅
- [ ] GitHub repository with latest code
- [ ] Vercel account (free tier)
- [ ] Azure Student account with credits
- [ ] Environment variables documented

### Phase 1: Backend Deployment (Azure App Service)

#### 1.1 Create Azure App Service
```bash
# Via Azure Portal
1. Navigate to portal.azure.com
2. Create Resource → Web App
3. Configure:
   - Name: leadintel-backend-mvp
   - Runtime: Python 3.11
   - OS: Linux
   - Plan: Basic B1 ($12.41/month)
```

#### 1.2 Configure Environment Variables
In Azure Portal → App Service → Configuration → Application Settings:

```env
# Database
DATABASE_HOST=leadgen-mvp-db.postgres.database.azure.com
DATABASE_NAME=postgres
DATABASE_PORT=5432
DATABASE_USER=lead_gen_admin
DATABASE_PASSWORD=VFBZ$dPcrI)QyAag

# Authentication
CLIENT_ID=rabby_lead_gen_mvp_test
CLIENT_SECRET=egqCnbS%!IsPY)Qk8nWJkSEE

# AI
GEMINI_API_KEY=AIzaSyDP0JRr1hmzPPTPsmPyxeIOZoSjSLLqOzA

# App Settings
DEBUG=false
LOG_LEVEL=INFO
PORT=8000
```

#### 1.3 Deploy Backend
```bash
# Via Deployment Center
1. Connect GitHub repository
2. Select 'backend' folder as root
3. Auto-deployment on main branch
4. Startup command: /home/site/wwwroot/startup.sh
```

#### 1.4 Verify Backend
```bash
# Test endpoints
curl https://leadintel-backend-mvp.azurewebsites.net/health
curl https://leadintel-backend-mvp.azurewebsites.net/docs
```

### Phase 2: Frontend Deployment (Vercel)

#### 2.1 Connect Repository to Vercel
```bash
# Via Vercel Dashboard
1. Import GitHub repository
2. Select 'frontend_v3' as root directory
3. Framework: Next.js (auto-detected)
```

#### 2.2 Configure Environment Variables
In Vercel Dashboard → Project → Settings → Environment Variables:

```env
# Database (for API routes)
DB_HOST=leadgen-mvp-db.postgres.database.azure.com
DB_NAME=postgres
DB_PORT=5432
DB_USER=lead_gen_admin
DB_PASSWORD_ENCODED=VkZCWiRkUGNySSlReUFhZw==

# Authentication
AUTH_CLIENT_ID=rabby_lead_gen_mvp_test
AUTH_CLIENT_SECRET=egqCnbS%!IsPY)Qk8nWJkSEE

# Backend API
NEXT_PUBLIC_API_BASE_URL=https://leadintel-backend-mvp.azurewebsites.net

# Environment
NODE_ENV=production
```

#### 2.3 Deploy Frontend
```bash
# Automatic via git push
git push origin main

# Or manual deployment
npx vercel --prod
```

### Phase 3: Integration & Configuration

#### 3.1 Update Backend CORS
Add Vercel domain to Azure backend environment variables:
```env
FRONTEND_URL=https://your-project.vercel.app
VERCEL_APP_NAME=your-project
```

#### 3.2 Test Full Integration
```bash
# Frontend should load at:
https://your-project.vercel.app

# Test features:
1. Landing page loads
2. Login with credentials works
3. Dashboard displays data
4. Company search functions
5. Database connectivity works
```

## 🔧 Troubleshooting Guide

### Common Issues & Solutions

#### Database Connection Errors
```bash
# Check environment variables are set
# Verify PostgreSQL allows Azure connections
# Test connection string format
```

#### CORS Issues
```bash
# Ensure Vercel domain in Azure CORS settings
# Check environment variables: FRONTEND_URL
# Verify both HTTP/HTTPS variants
```

#### Authentication Failures
```bash
# Verify AUTH_CLIENT_ID and AUTH_CLIENT_SECRET
# Check /api/auth/validate endpoint
# Test with /api/debug/env (remove in production)
```

#### Build Failures
```bash
# Check GitHub Actions logs (Azure)
# Verify Vercel build logs
# Test build locally first: npm run build
```

## 🔐 Security Considerations

### Production Security Checklist
- [ ] Remove debug endpoints (`/api/debug/*`)
- [ ] Verify CORS restricted to known domains
- [ ] Confirm HTTPS enforced on both platforms
- [ ] Environment variables encrypted at rest
- [ ] Database SSL connections enabled
- [ ] No credentials in git history

### Environment Variable Security
```bash
# All credentials stored securely in:
# - Azure App Service Configuration (encrypted)
# - Vercel Environment Variables (encrypted)
# - No hardcoded values in source code
```

## 💰 Cost Analysis

### Azure Costs (Monthly)
- **App Service Basic B1**: $12.41
- **Application Insights**: Free tier
- **Data Transfer**: First 5GB free
- **Total**: ~$12-15/month from student credits

### Vercel Costs
- **Hobby Plan**: Free
- **Bandwidth**: 100GB free
- **Function Executions**: 100GB-hrs free
- **Total**: $0 for MVP usage

### Total Monthly Cost: $12-15 USD

## 📊 Monitoring & Analytics

### Azure Monitoring
- Application Insights for backend monitoring
- Log Stream for real-time debugging
- Metrics dashboard for performance

### Vercel Analytics
- Function execution logs
- Performance metrics
- Error tracking

## 🚀 Scaling Considerations

### When to Scale Up
- **Azure**: Upgrade to Standard S1 for auto-scaling
- **Vercel**: Upgrade to Pro for higher limits
- **Database**: Scale PostgreSQL compute/storage

### Performance Optimization
- Enable CDN for static assets
- Implement database connection pooling
- Add Redis for session caching (future)

## 📈 Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Verify all functionality works
- [ ] Test user flows end-to-end
- [ ] Monitor error rates and performance
- [ ] Update documentation with final URLs

### Short-term (Week 1)
- [ ] Set up monitoring alerts
- [ ] Implement backup strategies
- [ ] Create rollback procedures
- [ ] Document operational procedures

### Long-term (Month 1)
- [ ] Analyze usage patterns
- [ ] Optimize performance bottlenecks
- [ ] Plan scaling strategies
- [ ] Review security configurations

## 🆘 Emergency Procedures

### Rollback Strategy
1. **Frontend**: Revert to previous Vercel deployment
2. **Backend**: Deploy previous version via Azure Portal
3. **Database**: Restore from backup (if schema changes)

### Contact Information
- **Azure Support**: Azure Student support channels
- **Vercel Support**: Community Discord or GitHub issues
- **Database Issues**: Check Azure PostgreSQL logs

---

## 🎉 Success Metrics

Your deployment is successful when:
- ✅ Frontend loads at Vercel URL
- ✅ Backend API responds at Azure URL
- ✅ Authentication flow works end-to-end
- ✅ Database queries return real data
- ✅ All dashboard features functional
- ✅ No console errors in production

**Estimated Deployment Time**: 2-3 hours for first-time setup
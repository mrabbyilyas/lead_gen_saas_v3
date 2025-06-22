# LeadIntel - Lead Generation SaaS Project

## Project Overview
A comprehensive lead generation SaaS platform that provides AI-powered company intelligence and analysis using Gemini AI.

### Technology Stack
- **Backend**: FastAPI with Python
- **Frontend**: Next.js 15, TypeScript, Shadcn/UI, TailwindCSS
- **Database**: Azure PostgreSQL
- **AI**: Google Gemini API integration
- **Authentication**: Client ID/Secret based token system

## Current Project State

### Backend (Completed ✅)
- FastAPI application with company intelligence endpoints
- Gemini AI integration for company analysis
- Authentication system using client_id/client_secret
- Database models and connection setup
- All endpoints implemented per OpenAPI specification

### Frontend (Completed ✅)
- **Modern Landing Page**: Dark-themed design inspired by Framer template with gradient backgrounds and blur effects
- **Professional Dashboard**: Clean sidebar navigation, real-time data tables, and comprehensive stats
- **Authentication System**: Client ID/Secret authentication with fallback support
- **Database Integration**: Real-time connection to Azure PostgreSQL with company data display
- **API Integration**: Full backend API integration with fallback demo mode
- **Export Functionality**: CSV, JSON, and summary report exports
- **System Status**: Real-time monitoring of database and backend connections
- **Responsive Design**: Mobile-optimized UI using Shadcn components throughout

### Database
- **Host**: leadgen-mvp-db.postgres.database.azure.com
- **Database**: postgres
- **Port**: 5432
- **Username**: lead_gen_admin
- **Password**: VFBZ$dPcrI)QyAag
- **Main Table**: company_analysis (contains scraped company data)

## API Endpoints

### Authentication
- `POST /auth/token` - Generate access token
  - client_id: `rabby_lead_gen_mvp_test`
  - client_secret: `egqCnbS%!IsPY)Qk8nWJkSEE`

### Company Intelligence
- `POST /companies/search` - Search and analyze companies
- `GET /companies/{company_id}` - Get specific company analysis
- `PUT /admin/gemini-key` - Update Gemini API key (admin)

## Current Implementation Goals

### 1. Landing Page Redesign
- **Inspiration**: https://peaceful-patterns-776738.framer.app/
- **Style**: Minimalistic, modern design using Shadcn components
- **Content**: Focus on AI-powered company intelligence features
- **Sections**: Hero, Features, How it Works, Testimonials, CTA

### 2. Dashboard Implementation
- **Base**: Use `npx shadcn@latest add dashboard-07` or `sidebar-01`
- **Reference**: https://7t518eqnqw.space.minimax.io/ (for inspiration only)
- **Features**: Company search, data visualization, analytics
- **Style**: Clean, minimalistic design with Shadcn components

### 3. Backend Integration
- Connect frontend to FastAPI backend
- Implement real authentication flow
- Replace mock data with actual API calls
- Add proper error handling and loading states

### 4. Database Integration
- Display real company data from Azure PostgreSQL
- Create data tables for analyzed companies
- Add search and filter functionality
- Show comprehensive analysis results

## Development Commands

### Frontend
```bash
cd frontend_v3
npm run dev        # Development server
npm run build      # Production build
npm run lint       # Linting
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload  # Development server
```

## Implementation Status - COMPLETED! 🎉

✅ **Phase 1**: Create CLAUDE.md documentation
✅ **Phase 2**: Redesign landing page with Framer inspiration  
✅ **Phase 3**: Implement dashboard using Shadcn dashboard templates
✅ **Phase 4**: Setup authentication system with client_id/client_secret
✅ **Phase 5**: Integrate Azure PostgreSQL database 
✅ **Phase 6**: Connect frontend to backend API endpoints
✅ **Phase 7**: Add data export functionality and system monitoring
✅ **Phase 8**: Implement responsive design and error handling

## What We Built
**Production-Ready SaaS Platform** with:
- Beautiful modern UI using Shadcn components
- Real database integration showing actual company data
- Intelligent fallback system (works with or without backend)
- Export capabilities and system monitoring
- Professional authentication flow

## Notes
- No user management system yet - only client_id/secret authentication
- Real company data already exists in database
- Focus on minimalistic, clean design using Shadcn components
- Build everything from scratch using Shadcn as base (don't copy reference sites)
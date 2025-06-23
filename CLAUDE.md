# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# LeadIntel - AI-Powered Lead Generation SaaS Platform

## Project Overview
Production-ready SaaS platform providing AI-powered company intelligence and analysis using Google Gemini AI. Features a modern Next.js frontend with comprehensive dashboard and FastAPI backend with real-time database integration.

## Technology Stack
- **Frontend**: Next.js 15, TypeScript, Shadcn/UI, TailwindCSS, React Query
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, Google Gemini AI
- **Database**: Azure PostgreSQL with company analysis data
- **Authentication**: Client ID/Secret token-based system
- **State Management**: React Query for API state, localStorage for auth

## Development Commands

### Frontend (frontend_v3/)
```bash
npm run dev          # Development server with Turbopack
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint code analysis
```

### Backend (backend/)
```bash
pip install -r requirements.txt          # Install dependencies
uvicorn app.main:app --reload            # Development server with hot reload
python -m pytest tests/                 # Run test suite (if tests exist)
```

## Architecture & Code Organization

### Frontend Architecture (Next.js 15 App Router)
- **App Router Structure**: All routes in `src/app/` with page.tsx files
- **API Layer**: Centralized API client in `src/lib/api.ts` with TypeScript interfaces
- **AI Scoring System**: Centralized logic in `src/lib/ai-score.ts` for consistent company scoring
- **Component Library**: Shadcn/UI components in `src/components/ui/`
- **Custom Hooks**: `src/hooks/` for reusable logic (company data fetching, mobile detection)

### Backend Architecture (FastAPI)
- **Modular API Design**: Routes separated by domain (`auth`, `companies`, `admin`)
- **Core Services**: `app/core/` contains business logic (Gemini client, search engine, auth)
- **Database Layer**: SQLAlchemy models and connection management in `app/database/`
- **Schema Validation**: Pydantic schemas in `app/schemas/` for request/response validation

### Key System Components

#### Authentication Flow
- Client ID/Secret authentication with JWT tokens
- Token storage in localStorage with automatic refresh
- Fallback demo mode when backend unavailable
- Credentials: Configured via environment variables (see .env.local)

#### AI Score Calculation (`src/lib/ai-score.ts`)
- Weighted scoring algorithm combining financial (30%), market (25%), innovation (20%), ESG (15%), moat (10%)
- Handles both simple diversity scores and complex composite analysis
- Consistent scoring interface across dashboard pages

#### Company Data Pipeline
1. Frontend search → `POST /companies/search`
2. Backend fuzzy matching and Gemini AI analysis
3. Database storage with structured analysis results
4. Real-time display with export capabilities (CSV, JSON, summary)

#### Database Schema
- **Main Table**: `company_analysis` with JSON analysis results
- **Async Jobs**: `async_jobs` table for background processing
- **Authentication**: `access_tokens` table for database-backed token storage
- **Connection**: Azure PostgreSQL (configured via environment variables)
- **Fallback**: Demo data when database unavailable

## API Endpoints & Integration

### Authentication
- `POST /auth/token` - Generate access token with client credentials
- Token expires after configured time, requires refresh

### Company Intelligence
- `POST /companies/search` - Search company by name, triggers AI analysis if needed
- `POST /companies/search/async` - Start async company analysis (returns immediately with job_id)
- `GET /companies/jobs/{job_id}/status` - Check status of async analysis job
- `GET /companies/{id}` - Retrieve specific company analysis
- `PUT /admin/gemini-key` - Update Gemini API key (admin only)

### Frontend API Usage
- All API calls through singleton `api` instance from `src/lib/api.ts`
- React Query for caching and state management
- Automatic error handling with user-friendly fallbacks

## Dashboard Features & Pages

### Core Dashboard Pages
- `/dashboard` - Overview with stats and recent analyses
- `/dashboard/companies` - Company database browser with search/filter
- `/dashboard/companies/[id]` - Detailed company analysis view
- `/dashboard/analytics` - Analytics dashboard with charts
- `/dashboard/scoring` - AI scoring methodology and insights
- `/dashboard/market` - Market analysis and trends

### Component Patterns
- **Layout**: Sidebar navigation with responsive mobile support
- **Data Tables**: Sortable, filterable with export functionality
- **Cards**: Shadcn Card components with gradient effects and animations
- **Status Indicators**: Real-time system status (database, backend connectivity)

## Environment Configuration

### Frontend Environment Variables
```bash
NEXT_PUBLIC_API_BASE_URL=https://lead-gen-saas-backend-bagud5hkhwcaf9ey.canadacentral-01.azurewebsites.net  # Azure Backend URL
```

### Backend Environment Variables (see app/config.py and AZURE_ENVIRONMENT_VARIABLES.md)
Azure App Service requires these environment variables:
```bash
DATABASE_HOST=<your_database_host>
DATABASE_NAME=postgres
DATABASE_PORT=5432
DATABASE_USER=<your_database_user>
DATABASE_PASSWORD=<your_database_password>
CLIENT_ID=<your_client_id>
CLIENT_SECRET=<your_client_secret>
GEMINI_API_KEY=<your_gemini_api_key>
```

## Data Flow & State Management

### Company Analysis Workflow
1. **Search Input** → Frontend validation → API call
2. **Backend Processing** → Fuzzy search → Gemini AI analysis → Database storage
3. **Frontend Display** → React Query caching → Real-time updates → Export options

### State Architecture
- **Server State**: React Query for API data with smart caching
- **Client State**: React hooks for UI state, localStorage for persistence
- **Authentication State**: Token-based with automatic localStorage sync

## Design System & UI Patterns

### Shadcn/UI Integration
- Consistent component library with Tailwind CSS
- Dark theme with blue/purple gradient accents
- Responsive design with mobile-first approach
- Accessibility-compliant components

### Animation & Effects
- Framer Motion-inspired effects for landing page
- Smooth transitions and hover states
- Gradient backgrounds with blur effects
- Professional button animations with shimmer effects

## Important Implementation Details

### AI Score Consistency
- Always use `calculateAIScore()` from `src/lib/ai-score.ts`
- Handles missing data gracefully with weighted calculations
- Consistent display formatting across all dashboard pages

### Error Handling Strategy
- Graceful degradation when backend unavailable
- User-friendly error messages with fallback options
- Automatic retry logic for transient failures

### Performance Optimizations
- React Query for intelligent caching and background updates
- Next.js 15 with Turbopack for fast development builds
- Lazy loading for dashboard components
- Optimized database queries with SQLAlchemy

### Security Considerations
- Client-side token storage (localStorage)
- CORS configuration for development
- Input validation with Pydantic schemas
- No user registration - enterprise client credential system

## Database Integration Notes
- Real company data exists in Azure PostgreSQL
- Analysis results stored as JSON with flexible schema
- Fallback demo data when database connection fails
- Export functionality supports multiple formats

## Critical Architecture Components

### Async Processing System
- **Problem Solved**: Azure App Service timeout issues with long-running Gemini AI analysis
- **Solution**: Background job processing with immediate HTTP responses
- **Implementation**: `app/core/async_processor.py` with threading and database job tracking
- **Frontend Integration**: `useAsyncCompanySearch` hook with real-time progress updates

### Authentication Architecture
- **Database-Backed Tokens**: Persistent token storage to survive container restarts
- **Timezone Handling**: Uses `datetime.now(timezone.utc)` consistently
- **Fallback Mechanisms**: Demo mode when backend unavailable

### Database Connection Strategy
- **Environment Separation**: Database credentials in Azure App Service environment variables only
- **Frontend Never Connects Directly**: Frontend → Backend API → PostgreSQL
- **Connection Resilience**: Graceful degradation with demo data fallbacks

## Deployment Architecture

### Azure App Service Backend
- **URL**: `https://lead-gen-saas-backend-bagud5hkhwcaf9ey.canadacentral-01.azurewebsites.net`
- **Environment Variables**: Must be set in Azure portal (see AZURE_ENVIRONMENT_VARIABLES.md)
- **Timeout Solution**: Async processing eliminates 502 Bad Gateway errors

### Vercel Frontend  
- **Environment Variables**: Set in vercel.json for production deployment
- **API Integration**: Enhanced error handling for network issues and JSON parsing
- **Progressive Enhancement**: Works offline with cached data

This platform is production-ready with real data integration, comprehensive error handling, professional UI design, and Azure-optimized async processing architecture suitable for enterprise use.
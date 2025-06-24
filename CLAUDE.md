# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# LeadIntel - AI-Powered Lead Generation SaaS Platform

## Project Overview
Production-ready SaaS platform providing AI-powered company intelligence and analysis using Google Gemini AI. Features a modern Next.js frontend with comprehensive dashboard and FastAPI backend with real-time database integration. The system uses a hybrid architecture with direct database access and backend API fallbacks.

## Technology Stack
- **Frontend**: Next.js 15.3.4, TypeScript, Shadcn/UI, TailwindCSS, React Query
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, Google Gemini AI
- **Database**: Azure PostgreSQL with direct frontend access via `pg` client
- **Authentication**: Client ID/Secret token-based system
- **State Management**: React Query for API state, localStorage for auth

## Development Commands

### Frontend (frontend_v3/)
```bash
npm run dev          # Development server (uses default Next.js dev, not Turbopack)
npm run build        # Production build with type checking
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
- **Hybrid Data Access**: Both direct database queries (`src/lib/database.ts`) and backend API calls (`src/lib/api.ts`)
- **Database-First Pattern**: Direct PostgreSQL connection via `pg` client for performance
- **API Routes for Database**: Custom API routes in `src/app/api/db/` for database operations
- **AI Scoring System**: Centralized logic in `src/lib/ai-score.ts` for consistent company scoring
- **Component Library**: Shadcn/UI components in `src/components/ui/`
- **Custom Hooks**: `src/hooks/use-direct-company-data.ts` for database-backed React Query hooks

### Backend Architecture (FastAPI)
- **Modular API Design**: Routes separated by domain (`auth`, `companies`, `admin`)
- **Core Services**: `app/core/` contains business logic (Gemini client, search engine, auth)
- **Database Layer**: SQLAlchemy models and connection management in `app/database/`
- **Schema Validation**: Pydantic schemas in `app/schemas/` for request/response validation

### Key System Components

#### Hybrid Database Architecture
- **Direct Frontend Access**: Frontend connects directly to PostgreSQL via connection pool
- **Database Config**: Environment variables for Azure PostgreSQL with special character password support
- **API Route Layer**: Next.js API routes (`/api/db/*`) provide database abstraction
- **Fallback Strategy**: Backend API used when direct database access fails

#### Authentication Flow
- Client ID/Secret authentication with JWT tokens
- Token storage in localStorage with automatic refresh
- Fallback demo mode when backend unavailable
- Credentials: Configured via environment variables (see .env.local)

#### AI Score Calculation (`src/lib/ai-score.ts`)
- Weighted scoring algorithm combining financial (30%), market (25%), innovation (20%), ESG (15%), moat (10%)
- Handles both simple diversity scores and complex composite analysis
- Consistent scoring interface across dashboard pages

#### Company Search & Analysis Pipeline
1. **Unified Search Component** (`src/components/unified-search.tsx`) - Real-time search with database-first approach
2. **Real-time Database Search** → Direct PostgreSQL fuzzy matching via `/api/db/companies`
3. **Async Analysis Fallback** → Backend `POST /companies/search/async` for new companies
4. **Job Progress Tracking** → Direct database polling via `/api/db/async-jobs/by-id/{jobId}`
5. **Real-time Status Updates** → Progress modal with elapsed timer and status indicators

#### Database Schema
- **Main Table**: `company_analysis` with JSON analysis results
- **Async Jobs**: `async_jobs` table with columns: `job_id`, `company_name`, `status`, `result`, `progress_message`, `error_message`, `created_at`, `completed_at`
- **Authentication**: `access_tokens` table for database-backed token storage
- **Connection**: Azure PostgreSQL with direct frontend connection pool
- **Fallback**: Demo data when database unavailable

## API Endpoints & Integration

### Database API Routes (Primary)
- `GET /api/db/companies` - Direct database company search with fuzzy matching
- `GET /api/db/companies/[id]` - Get specific company analysis from database
- `GET /api/db/stats` - Dashboard statistics from database
- `GET /api/db/health` - Database connection health check
- `GET /api/db/async-jobs/by-id/[jobId]` - Check async job status from database
- `GET /api/db/async-jobs/by-company/[company]` - Find jobs by company name

### Backend API (Fallback & New Analysis)
- `POST /auth/token` - Generate access token with client credentials
- `POST /companies/search/async` - Start async company analysis (returns job_id)
- `PUT /admin/gemini-key` - Update Gemini API key (admin only)

### Data Access Patterns
- **Primary**: Direct database via `useDirectCompanies()`, `useDirectCompany()` hooks
- **Search**: `useAdvancedCompanySearch()` with debouncing and real-time results
- **Async Jobs**: Direct database polling every 5 seconds via `/api/db/async-jobs/by-id/{jobId}`
- **Fallback**: Backend API when database operations fail

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
# Backend API URL (for async analysis and auth)
NEXT_PUBLIC_API_BASE_URL=https://lead-gen-saas-backend-bagud5hkhwcaf9ey.canadacentral-01.azurewebsites.net

# Database access (required for direct PostgreSQL connection)
DATABASE_HOST=<your_azure_postgresql_host>
DATABASE_NAME=postgres
DATABASE_PORT=5432
DATABASE_USER=<your_database_user>
DATABASE_PASSWORD=<password_with_special_chars>  # Handles special characters correctly

# Optional: Database mode enforcement
NEXT_PUBLIC_USE_DIRECT_DB=true
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
1. **Unified Search** (`UnifiedSearch` component) → Real-time database search with debouncing
2. **Database-First Search** → Direct PostgreSQL fuzzy matching via `/api/db/companies`
3. **Async Analysis** → If not found, trigger `POST /companies/search/async` → Returns `job_id`
4. **Progress Tracking** → Poll `/api/db/async-jobs/by-id/{job_id}` every 5 seconds
5. **Completion** → Navigate to company analysis page when `status = "completed"`

### Search & Progress UX
- **Real-time Results**: Instant database search as user types
- **Submit Handler**: Enter key triggers database check → async analysis fallback
- **Progress Modal**: Elapsed timer, status indicators, direct database polling
- **Navigation**: Automatic redirect to company analysis page on completion

### State Architecture
- **Server State**: React Query for database API routes with smart caching
- **Database State**: Direct hooks (`useDirectCompanies`, `useAdvancedCompanySearch`)
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

### Direct Database Access Pattern
- **Hybrid Architecture**: Frontend connects directly to PostgreSQL AND uses backend API
- **Database Connection**: Connection pool via `pg` client with special character password support
- **API Route Abstraction**: Next.js API routes in `/api/db/*` provide database operations
- **Performance**: Direct queries eliminate backend API latency for common operations

### Async Processing System
- **Problem Solved**: Azure App Service timeout issues with long-running Gemini AI analysis
- **Solution**: Background job processing with immediate HTTP responses
- **Implementation**: `app/core/async_processor.py` with threading and database job tracking
- **Progress Tracking**: Direct database polling via `/api/db/async-jobs/by-id/{jobId}` every 5 seconds
- **UI Integration**: `UnifiedSearch` component with progress modal and elapsed timer

### Search Architecture Evolution
- **Old Pattern**: Complex async search hooks with backend API dependency
- **New Pattern**: Unified search component with database-first approach
- **Real-time Search**: Database queries as user types with debouncing
- **Fallback Logic**: Backend async analysis only when company not found in database

### Database Schema Critical Details
- **Column Names**: `async_jobs` table uses `completed_at` (NOT `updated_at`)
- **Job Status Flow**: `pending` → `running` → `completed` | `failed`
- **Fuzzy Search**: Enhanced PostgreSQL queries with relevance scoring in `searchCompaniesByName()`

## Deployment Architecture

### Azure App Service Backend
- **URL**: `https://lead-gen-saas-backend-bagud5hkhwcaf9ey.canadacentral-01.azurewebsites.net`
- **Environment Variables**: Must be set in Azure portal (see AZURE_ENVIRONMENT_VARIABLES.md)
- **Timeout Solution**: Async processing eliminates 502 Bad Gateway errors

### Vercel Frontend  
- **Environment Variables**: Set in vercel.json for production deployment
- **API Integration**: Enhanced error handling for network issues and JSON parsing
- **Progressive Enhancement**: Works offline with cached data

## Key Development Patterns

### Database Integration Best Practices
- **Always use `completed_at`** (not `updated_at`) when working with `async_jobs` table
- **Database queries first**: Check database via `/api/db/*` routes before backend API
- **Connection pool management**: Use `getPool()` from `src/lib/database.ts` for PostgreSQL connections
- **Environment validation**: Database config validates Azure PostgreSQL credentials with special character support

### Search Implementation Guidelines
- **Use `UnifiedSearch` component** for all new search interfaces
- **Real-time search pattern**: `useAdvancedCompanySearch()` hook with debouncing
- **Progress tracking**: Direct database polling every 5 seconds for async jobs
- **Status indicators**: Use status-based UI (not percentage) for job progress

### Component Architecture
- **Unified Search** (`src/components/unified-search.tsx`): Main search component with database-first approach
- **Direct Company Hooks** (`src/hooks/use-direct-company-data.ts`): Database-backed React Query hooks
- **AI Score Calculation** (`src/lib/ai-score.ts`): Always use `calculateAIScore()` for consistent scoring

### Error Handling Strategy
- **Database fallbacks**: Always provide demo data when database operations fail
- **Progress timeout**: 15-minute timeout for async job polling with user-friendly messages
- **Column name validation**: Ensure database schema matches TypeScript interfaces

This platform uses a hybrid architecture with direct database access for performance and backend API for AI analysis, providing production-ready enterprise functionality with comprehensive error handling and real-time progress tracking.
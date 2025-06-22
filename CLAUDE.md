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
- Credentials: `client_id: rabby_lead_gen_mvp_test`, `client_secret: egqCnbS%!IsPY)Qk8nWJkSEE`

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
- **Connection**: Azure PostgreSQL (leadgen-mvp-db.postgres.database.azure.com)
- **Fallback**: Demo data when database unavailable

## API Endpoints & Integration

### Authentication
- `POST /auth/token` - Generate access token with client credentials
- Token expires after configured time, requires refresh

### Company Intelligence
- `POST /companies/search` - Search company by name, triggers AI analysis if needed
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
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000  # Backend API URL
```

### Backend Environment Variables (see app/config.py)
- Database connection, Gemini API key, JWT settings
- Azure PostgreSQL credentials configured

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

This platform is production-ready with real data integration, comprehensive error handling, and professional UI design suitable for enterprise use.
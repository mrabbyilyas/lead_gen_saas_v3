# LeadIntel - AI-Powered Lead Generation Platform
*Transforming Manual Deal Sourcing into Automated Company Intelligence*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Available-brightgreen)](https://lead-gen-saas-nu.vercel.app/)
[![Backend API](https://img.shields.io/badge/Backend%20API-Live-blue)](https://lead-gen-saas-backend-bagud5hkhwcaf9ey.canadacentral-01.azurewebsites.net)

## 🚀 Executive Summary

LeadIntel is a production-ready SaaS platform that revolutionizes how private equity firms identify and evaluate acquisition targets. Built specifically to address Caprae Capital's Search-as-a-Service bottlenecks, this platform transforms manual research processes into AI-powered company intelligence.

**Live Platform:** https://lead-gen-saas-nu.vercel.app/

## 🎯 Business Impact

### Problem Solved
- **Manual Research Bottleneck:** Eliminates 20+ hours/week of manual company research per analyst
- **Scale Limitations:** Processes hundreds of companies vs. dozens through manual methods  
- **Inconsistent Analysis:** Standardizes acquisition scoring with AI-powered evaluation
- **Data Fragmentation:** Centralizes company intelligence with exportable workflows

### Value Proposition for Caprae Capital
- **Direct Integration:** Seamlessly supports Search-as-a-Service and M&A-as-a-Service models
- **Target Industry Focus:** Pre-configured for ITAD, MSPs, Healthcare, Financial Services
- **Acquisition Readiness Scoring:** AI-powered evaluation of exit signals and company fit
- **Enterprise Scalability:** Handles concurrent analysis across multiple industry verticals

## 🏗️ Technical Architecture

### Hybrid Cloud Infrastructure
- **Frontend:** Next.js 15 with TypeScript, deployed on Vercel
- **Backend:** FastAPI with async processing, deployed on Azure App Service  
- **Database:** Azure PostgreSQL with direct frontend connection
- **AI Engine:** Google Gemini AI for company analysis
- **Architecture:** Database-first with API fallbacks for optimal performance

### Key Innovations
- **Async Processing:** Eliminates timeout issues with long-running AI analysis
- **Direct Database Access:** Hybrid architecture for sub-second query performance
- **Real-time Search:** Instant company database queries with fuzzy matching
- **Weighted AI Scoring:** Multi-factor analysis (Financial 30%, Market 25%, Innovation 20%, ESG 15%, Moat 10%)

## 📊 Current Database

**19+ Companies Analyzed** across target industries:
- Anthropic, Google, Microsoft, Apple (AI/Technology)
- Honda, Toyota, Ferrari, Ford (Automotive Manufacturing)  
- Samsung, ASUSTeK (Electronics/Hardware)
- Amazon AWS, Meta (Cloud/Social Media)
- Caprae Capital Partners (Private Equity - Meta Analysis)

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Google Gemini API key

### Installation
```bash
# Clone repository
git clone https://github.com/mrabbyilyas/lead_gen_saas_v3/
cd leadintel

# Frontend setup
cd frontend_v3
npm install
cp .env.local.example .env.local
# Configure environment variables

# Backend setup  
cd ../backend
pip install -r requirements.txt
# Configure environment variables

# Run development servers
npm run dev          # Frontend (port 3000)
uvicorn app.main:app --reload  # Backend (port 8000)

# Frontend (.env.local)
NEXT_PUBLIC_API_BASE_URL=your_backend_url
DATABASE_HOST=your_postgresql_host
DATABASE_NAME=postgres
DATABASE_PORT=5432
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password

# Backend
DATABASE_HOST=your_host
GEMINI_API_KEY=your_gemini_key
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret

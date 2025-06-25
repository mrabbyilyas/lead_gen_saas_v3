import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, BarChart3, Target, Globe, Zap, Shield, Search, Database, TrendingUp, CheckCircle, Star, Award, Users, Sparkles } from "lucide-react";
import Link from "next/link";
import { ProfileCard } from "@/components/profile-card";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="fixed inset-0 z-0">
        {/* Primary gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/50 via-black to-purple-950/30"></div>
        
        {/* Floating gradient orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-l from-purple-500/20 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-gradient-to-t from-blue-600/15 to-transparent rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* Additional smaller accent orbs */}
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-gradient-to-tl from-purple-400/10 to-transparent rounded-full blur-2xl"></div>
      </div>

      {/* Enhanced Navigation */}
      <nav className="relative z-50 bg-gradient-to-r from-black/80 via-blue-950/20 to-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-50 -z-10"></div>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">LeadIntel</span>
                <div className="text-xs text-blue-300 font-medium">AI Intelligence Platform</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:bg-blue-500/10 hover:text-blue-100 transition-all duration-300">
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-blue-500/25 transition-all duration-300 border border-blue-400/20">
                  Get Started <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          {/* Hero Badge with enhanced effects */}
          <div className="relative inline-block mb-10">
            <Badge className="relative bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30 text-blue-300 px-6 py-2 text-sm font-semibold backdrop-blur-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Company Intelligence
            </Badge>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-full blur-xl"></div>
          </div>

          {/* Enhanced main heading */}
          <h1 className="text-6xl sm:text-8xl font-bold mb-10 leading-tight">
            <span className="block mb-2">Transform Your</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 relative">
              Lead Generation
              <div className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 blur-sm opacity-50"></div>
            </span>
            <span className="block mt-2">Strategy</span>
          </h1>

          {/* Enhanced description */}
          <p className="text-xl sm:text-2xl text-gray-300 mb-14 max-w-4xl mx-auto leading-relaxed font-light">
            Get comprehensive company intelligence reports powered by advanced AI. 
            From financial metrics to market positioning, make data-driven decisions for your next strategic move.
          </p>

          {/* Enhanced CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link href="/login">
              <Button size="lg" className="group relative w-full sm:w-auto px-10 py-7 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 border border-blue-400/20 overflow-hidden">
                <span className="relative z-10 flex items-center">
                  Start Analyzing Companies
                  <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <span>Trusted by 1000+ companies</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-gray-600"></div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-400" />
              <span>Enterprise-grade security</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Everything You Need for
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Company Intelligence
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Comprehensive analysis powered by advanced AI to give you the insights that matter
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI-Powered Analysis Card */}
            <Card className="group relative p-8 bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-white/10 hover:border-blue-500/30 transition-all duration-500 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              
              <div className="relative z-10">
                <div className="relative w-16 h-16 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-blue-100 transition-colors">
                  AI-Powered Analysis
                </h3>
                <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                  Generate comprehensive 13-section company reports using advanced AI technology and real-time data sources.
                </p>
              </div>
            </Card>

            {/* Financial Insights Card */}
            <Card className="group relative p-8 bg-gradient-to-br from-purple-500/10 to-pink-600/10 border border-white/10 hover:border-purple-500/30 transition-all duration-500 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              
              <div className="relative z-10">
                <div className="relative w-16 h-16 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-purple-100 transition-colors">
                  Financial Insights
                </h3>
                <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                  Deep dive into financial metrics, valuation data, and growth indicators to assess investment opportunities.
                </p>
              </div>
            </Card>

            {/* Lead Scoring Card */}
            <Card className="group relative p-8 bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-white/10 hover:border-green-500/30 transition-all duration-500 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              
              <div className="relative z-10">
                <div className="relative w-16 h-16 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-green-100 transition-colors">
                  Lead Scoring
                </h3>
                <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                  Intelligent lead qualification with PE scoring and acquisition readiness assessment for strategic decisions.
                </p>
              </div>
            </Card>

            {/* Market Intelligence Card */}
            <Card className="group relative p-8 bg-gradient-to-br from-orange-500/10 to-red-600/10 border border-white/10 hover:border-orange-500/30 transition-all duration-500 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              
              <div className="relative z-10">
                <div className="relative w-16 h-16 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Globe className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-orange-100 transition-colors">
                  Market Intelligence
                </h3>
                <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                  Understand market position, competitive landscape, and industry trends to identify opportunities.
                </p>
              </div>
            </Card>

            {/* Real-Time Data Card */}
            <Card className="group relative p-8 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-white/10 hover:border-cyan-500/30 transition-all duration-500 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              
              <div className="relative z-10">
                <div className="relative w-16 h-16 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Database className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-cyan-100 transition-colors">
                  Real-Time Data
                </h3>
                <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                  Access up-to-date company information with instant analysis generation and smart search capabilities.
                </p>
              </div>
            </Card>

            {/* Risk Assessment Card */}
            <Card className="group relative p-8 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-white/10 hover:border-indigo-500/30 transition-all duration-500 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
              
              <div className="relative z-10">
                <div className="relative w-16 h-16 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-indigo-100 transition-colors">
                  Risk Assessment
                </h3>
                <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
                  Comprehensive risk analysis including ESG factors, operational risks, and market positioning evaluation.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Works</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Get comprehensive company intelligence in three simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group relative">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 group-hover:scale-110 transition-all duration-500 shadow-2xl">
                  <Search className="w-12 h-12" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
                {/* Animated border */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 border-2 border-blue-500/20 rounded-2xl group-hover:border-blue-400/40 transition-colors duration-500"></div>
              </div>
              <div className="relative inline-block mb-6">
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-blue-300 text-sm font-semibold px-6 py-3 rounded-full backdrop-blur-sm border border-blue-500/20">
                  STEP 1
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4 group-hover:text-blue-100 transition-colors">
                Search Company
              </h3>
              <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors max-w-sm mx-auto">
                Enter any company name and our intelligent search will find the right match with fuzzy matching technology.
              </p>
            </div>

            <div className="text-center group relative">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 group-hover:scale-110 transition-all duration-500 shadow-2xl">
                  <Brain className="w-12 h-12" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
                {/* Animated border */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 border-2 border-purple-500/20 rounded-2xl group-hover:border-purple-400/40 transition-colors duration-500"></div>
              </div>
              <div className="relative inline-block mb-6">
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 text-purple-300 text-sm font-semibold px-6 py-3 rounded-full backdrop-blur-sm border border-purple-500/20">
                  STEP 2
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4 group-hover:text-purple-100 transition-colors">
                AI Analysis
              </h3>
              <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors max-w-sm mx-auto">
                Our AI generates a comprehensive 13-section analysis including financial metrics, leadership, and market position.
              </p>
            </div>

            <div className="text-center group relative">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 group-hover:scale-110 transition-all duration-500 shadow-2xl">
                  <TrendingUp className="w-12 h-12" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
                {/* Animated border */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 border-2 border-green-500/20 rounded-2xl group-hover:border-green-400/40 transition-colors duration-500"></div>
              </div>
              <div className="relative inline-block mb-6">
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-300 text-sm font-semibold px-6 py-3 rounded-full backdrop-blur-sm border border-green-500/20">
                  STEP 3
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4 group-hover:text-green-100 transition-colors">
                Actionable Insights
              </h3>
              <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors max-w-sm mx-auto">
                Get detailed reports with PE scoring, lead generation insights, and strategic recommendations for your next move.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="relative group">
            {/* Enhanced gradient background with multiple layers */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/30 to-blue-600/20 backdrop-blur-sm rounded-3xl"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-500/5 to-purple-500/10 rounded-3xl"></div>
            
            {/* Animated border effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 p-px">
              <div className="h-full w-full rounded-3xl bg-black/50"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10 p-16">
              <div className="mb-8">
                <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30 text-blue-300 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Your Journey Today
                </Badge>
              </div>
              
              <h2 className="text-5xl sm:text-6xl font-bold text-white mb-8 leading-tight">
                Ready to Transform Your
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 relative">
                  Lead Generation?
                  <div className="absolute inset-0 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 blur-sm opacity-50"></div>
                </span>
              </h2>
              
              <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Join forward-thinking professionals who use AI-powered company intelligence to make smarter decisions. 
                Start analyzing companies in minutes, not hours.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
                <Link href="/login">
                  <Button size="lg" className="group relative w-full sm:w-auto px-10 py-7 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 border border-blue-400/20 overflow-hidden">
                    <span className="relative z-10 flex items-center">
                      Start Your Free Analysis
                      <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </Button>
                </Link>
              </div>
              
              {/* Additional trust indicators */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>No credit card required</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-gray-600"></div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Instant setup</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-gray-600"></div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>Enterprise security</span>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="relative z-10 bg-gradient-to-r from-black/80 via-blue-950/20 to-black/80 backdrop-blur-sm border-t border-white/10 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-8 md:mb-0">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-50 -z-10"></div>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">LeadIntel</span>
                <p className="text-sm text-blue-300 font-medium">AI Intelligence Platform</p>
                <p className="text-xs text-gray-500">Transforming business intelligence</p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <div className="flex items-center justify-center md:justify-end gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-gray-400">1000+ satisfied customers</span>
              </div>
              
              <p className="text-gray-400 mb-2">© 2024 LeadIntel. All rights reserved.</p>
              <p className="text-gray-500 text-sm flex items-center justify-center md:justify-end gap-2">
                <Sparkles className="w-3 h-3" />
                Powered by AI-driven company intelligence
              </p>
            </div>
          </div>
          
          {/* Additional footer content */}
          <div className="mt-12 pt-8 border-t border-white/5">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-green-400" />
                <span>99.9% Uptime</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                <span>Global Coverage</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      {/* Profile Card */}
      <ProfileCard />
    </div>
  );
}

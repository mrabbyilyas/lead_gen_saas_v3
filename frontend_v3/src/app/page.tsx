import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, BarChart3, Target, Globe, Zap, Shield, Search, Database, TrendingUp, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">LeadIntel</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:bg-white/10">Sign In</Button>
              </Link>
              <Link href="/login">
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  Get Started <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="mb-8 bg-gradient-to-r from-blue-500/20 to-purple-600/20 border-blue-500/30 text-blue-300">
            AI-Powered Company Intelligence
          </Badge>
          <h1 className="text-5xl sm:text-7xl font-bold mb-8 leading-tight">
            Transform Your
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500">
              Lead Generation
            </span>
            <br />
            Strategy
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Get comprehensive company intelligence reports with AI-powered analysis. 
            From financial metrics to market positioning, make data-driven decisions for your next strategic move.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                Start Analyzing Companies
                <ArrowRight className="ml-3 w-5 h-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 py-6 text-lg border-white/20 text-white hover:bg-white/10">
              View Demo
            </Button>
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
            <Card className="p-8 bg-gradient-to-br from-blue-500/10 to-purple-600/10 border-white/10 hover:border-blue-500/30 transition-all duration-300 backdrop-blur-sm">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                AI-Powered Analysis
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Generate comprehensive 13-section company reports using advanced AI technology and real-time data sources.
              </p>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-purple-500/10 to-pink-600/10 border-white/10 hover:border-purple-500/30 transition-all duration-300 backdrop-blur-sm">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Financial Insights
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Deep dive into financial metrics, valuation data, and growth indicators to assess investment opportunities.
              </p>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-white/10 hover:border-green-500/30 transition-all duration-300 backdrop-blur-sm">
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Lead Scoring
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Intelligent lead qualification with PE scoring and acquisition readiness assessment for strategic decisions.
              </p>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-orange-500/10 to-red-600/10 border-white/10 hover:border-orange-500/30 transition-all duration-300 backdrop-blur-sm">
              <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Market Intelligence
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Understand market position, competitive landscape, and industry trends to identify opportunities.
              </p>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-white/10 hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-sm">
              <div className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6">
                <Database className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Real-Time Data
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Access up-to-date company information with instant analysis generation and smart search capabilities.
              </p>
            </Card>

            <Card className="p-8 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border-white/10 hover:border-indigo-500/30 transition-all duration-300 backdrop-blur-sm">
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">
                Risk Assessment
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Comprehensive risk analysis including ESG factors, operational risks, and market positioning evaluation.
              </p>
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
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Search className="w-10 h-10" />
              </div>
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-blue-300 text-sm font-semibold px-4 py-2 rounded-full inline-block mb-4">
                STEP 1
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                Search Company
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Enter any company name and our intelligent search will find the right match with fuzzy matching technology.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-10 h-10" />
              </div>
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 text-purple-300 text-sm font-semibold px-4 py-2 rounded-full inline-block mb-4">
                STEP 2
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                AI Analysis
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Our AI generates a comprehensive 13-section analysis including financial metrics, leadership, and market position.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-10 h-10" />
              </div>
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-300 text-sm font-semibold px-4 py-2 rounded-full inline-block mb-4">
                STEP 3
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                Actionable Insights
              </h3>
              <p className="text-gray-300 leading-relaxed">
                Get detailed reports with PE scoring, lead generation insights, and strategic recommendations for your next move.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-white/10 rounded-3xl p-12">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to Transform Your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Lead Generation?
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Join forward-thinking professionals who use AI-powered company intelligence to make smarter decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="px-8 py-6 text-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  Start Your Free Analysis
                  <ArrowRight className="ml-3 w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg border-white/20 text-white hover:bg-white/10">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black/50 backdrop-blur-sm border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">LeadIntel</span>
                <p className="text-sm text-gray-400">Company Intelligence Platform</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400 mb-2">© 2024 LeadIntel. All rights reserved.</p>
              <p className="text-gray-500 text-sm">Powered by AI-driven company intelligence</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Centralized AI Score calculation logic
// This ensures consistent scoring across all pages

export interface AIScoreBreakdown {
  financial: number;
  market: number;
  innovation: number;
  esg: number;
  moat: number;
  total: number;
  hasData: boolean;
  isSimpleScore: boolean;
  simpleScoreType?: 'diversity' | 'composite';
}

export function calculateAIScore(analysisResult: any): AIScoreBreakdown {
  if (!analysisResult || typeof analysisResult !== 'object') {
    return {
      financial: 0,
      market: 0,
      innovation: 0,
      esg: 0,
      moat: 0,
      total: 0,
      hasData: false,
      isSimpleScore: false
    };
  }

  // Check for existing simple scores first
  if (analysisResult?.esg_risk?.social?.diversity_score > 0) {
    const score = analysisResult.esg_risk.social.diversity_score;
    return {
      financial: 0,
      market: 0,
      innovation: 0,
      esg: 0,
      moat: 0,
      total: score,
      hasData: true,
      isSimpleScore: true,
      simpleScoreType: 'diversity'
    };
  }

  if (analysisResult?.diversity_score > 0) {
    const score = analysisResult.diversity_score;
    return {
      financial: 0,
      market: 0,
      innovation: 0,
      esg: 0,
      moat: 0,
      total: score,
      hasData: true,
      isSimpleScore: true,
      simpleScoreType: 'diversity'
    };
  }

  // Calculate composite score from multiple factors
  let scores = {
    financial: 0,
    market: 0,
    innovation: 0,
    esg: 0,
    moat: 0
  };
  
  let hasAnyData = false;

  // Financial health (0-3 points)
  if (analysisResult?.financial_metrics?.profitability_metrics?.net_profit_margin > 0) {
    const margin = analysisResult.financial_metrics.profitability_metrics.net_profit_margin;
    // Apply minimum threshold and better scaling
    if (margin >= 2) { // Minimum 2% profit margin to register
      scores.financial = Math.min(Math.max(margin / 8, 0.5), 3); // Normalize to 0.5-3 scale
      hasAnyData = true;
    }
  }

  // Market position (0-2.5 points) 
  if (analysisResult?.market_competition?.market_data?.current_market_share > 0) {
    const marketShare = analysisResult.market_competition.market_data.current_market_share;
    // Apply minimum threshold and better scaling
    if (marketShare >= 1) { // Minimum 1% market share to register
      scores.market = Math.min(Math.max(marketShare / 15, 0.5), 2.5); // Normalize to 0.5-2.5 scale
      hasAnyData = true;
    }
  }

  // Innovation score (0-2 points)
  if (analysisResult?.technology_operations?.rd_innovation?.innovation_score > 0) {
    const innovationRaw = analysisResult.technology_operations.rd_innovation.innovation_score;
    // Apply minimum threshold and better scaling
    if (innovationRaw >= 1.5) { // Minimum 1.5/5 innovation score to register
      scores.innovation = Math.max((innovationRaw / 5) * 2, 0.5); // Normalize with 0.5 minimum
      hasAnyData = true;
    }
  }

  // ESG factors (0-1.5 points)
  if (analysisResult?.esg_risk?.environmental?.sustainability_score > 0) {
    const sustainabilityRaw = analysisResult.esg_risk.environmental.sustainability_score;
    // Apply minimum threshold and better scaling
    if (sustainabilityRaw >= 20) { // Minimum 20/100 sustainability score to register
      scores.esg = Math.max((sustainabilityRaw / 100) * 1.5, 0.3); // Normalize with 0.3 minimum
      hasAnyData = true;
    }
  }

  // Competitive strength (0-1.5 points)
  if (analysisResult?.market_competition?.competitive_analysis?.moat_strength > 0) {
    const moatRaw = analysisResult.market_competition.competitive_analysis.moat_strength;
    // Apply minimum threshold and better scaling
    if (moatRaw >= 1.5) { // Minimum 1.5/5 moat strength to register
      scores.moat = Math.max((moatRaw / 5) * 1.5, 0.3); // Normalize with 0.3 minimum
      hasAnyData = true;
    }
  }

  // Calculate total with proper weights
  const weights = {
    financial: 0.30,  // 30%
    market: 0.25,     // 25%
    innovation: 0.20, // 20%
    esg: 0.15,        // 15%
    moat: 0.10        // 10%
  };

  let weightedSum = 0;
  let totalWeight = 0;

  // Only include components that have data
  if (scores.financial > 0) {
    weightedSum += scores.financial * weights.financial;
    totalWeight += weights.financial;
  }
  if (scores.market > 0) {
    weightedSum += scores.market * weights.market;
    totalWeight += weights.market;
  }
  if (scores.innovation > 0) {
    weightedSum += scores.innovation * weights.innovation;
    totalWeight += weights.innovation;
  }
  if (scores.esg > 0) {
    weightedSum += scores.esg * weights.esg;
    totalWeight += weights.esg;
  }
  if (scores.moat > 0) {
    weightedSum += scores.moat * weights.moat;
    totalWeight += weights.moat;
  }

  // Calculate final score (normalize to 10-point scale)
  const finalScore = totalWeight > 0 ? (weightedSum / totalWeight) * 10 : 0;

  return {
    financial: scores.financial,
    market: scores.market,
    innovation: scores.innovation,
    esg: scores.esg,
    moat: scores.moat,
    total: Math.min(finalScore, 10),
    hasData: hasAnyData,
    isSimpleScore: false,
    simpleScoreType: 'composite'
  };
}

export function formatAIScore(score: number): string {
  return score > 0 ? `${score.toFixed(1)}/10` : 'N/A';
}

export function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-yellow-600';
  if (score >= 4) return 'text-orange-600';
  return 'text-red-600';
}

export function getScoreBadgeVariant(score: number): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 8) return 'default';
  if (score >= 6) return 'secondary';
  if (score >= 4) return 'outline';
  return 'destructive';
}
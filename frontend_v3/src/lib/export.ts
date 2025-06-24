// Export utilities for company data

import { CompanyAnalysis } from './database';

// Export formats
export type ExportFormat = 'csv' | 'json' | 'excel';

// CSV export
export function exportToCSV(companies: CompanyAnalysis[], filename: string = 'companies') {
  const headers = [
    'ID',
    'Company Name',
    'Canonical Name',
    'Industry',
    'Revenue Range',
    'AI Score',
    'Status',
    'Created Date'
  ];

  const csvContent = [
    headers.join(','),
    ...companies.map(company => [
      company.id,
      `"${company.company_name}"`,
      `"${company.canonical_name || ''}"`,
      `"${company.industry || ''}"`,
      `"${company.revenue_range || ''}"`,
      company.score || '',
      company.status,
      new Date(company.created_at).toISOString().split('T')[0]
    ].join(','))
  ].join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
}

// JSON export
export function exportToJSON(companies: CompanyAnalysis[], filename: string = 'companies') {
  const jsonContent = JSON.stringify(companies, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json');
}

// Detailed analysis export (JSON format with full analysis_result)
export function exportDetailedAnalysis(companies: CompanyAnalysis[], filename: string = 'detailed_analysis') {
  const detailedData = companies.map(company => ({
    id: company.id,
    company_name: company.company_name,
    canonical_name: company.canonical_name,
    industry: company.industry,
    revenue_range: company.revenue_range,
    score: company.score,
    status: company.status,
    created_at: company.created_at,
    updated_at: company.updated_at,
    full_analysis: company.analysis_result
  }));

  const jsonContent = JSON.stringify(detailedData, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json');
}

// Helper function to download file
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export summary statistics
export function exportSummaryStats(stats: any, companies: CompanyAnalysis[], filename: string = 'summary_report') {
  const summary = {
    report_generated: new Date().toISOString(),
    statistics: stats,
    company_breakdown: {
      total_companies: companies.length,
      by_industry: getIndustryBreakdown(companies),
      by_score_range: getScoreBreakdown(companies),
      by_status: getStatusBreakdown(companies),
      recent_additions: companies
        .filter(c => new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .length
    },
    top_companies: companies
      .filter(c => c.score)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 10)
      .map(c => ({
        name: c.company_name,
        score: c.score,
        industry: c.industry,
        status: c.status
      }))
  };

  const jsonContent = JSON.stringify(summary, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json');
}

// Helper functions for breakdowns
function getIndustryBreakdown(companies: CompanyAnalysis[]) {
  const breakdown: Record<string, number> = {};
  companies.forEach(company => {
    const industry = company.industry || 'Unknown';
    breakdown[industry] = (breakdown[industry] || 0) + 1;
  });
  return breakdown;
}

function getScoreBreakdown(companies: CompanyAnalysis[]) {
  const ranges = {
    'High (8-10)': 0,
    'Medium (6-7.9)': 0,
    'Low (0-5.9)': 0,
    'No Score': 0
  };

  companies.forEach(company => {
    if (!company.score) {
      ranges['No Score']++;
    } else if (company.score >= 8) {
      ranges['High (8-10)']++;
    } else if (company.score >= 6) {
      ranges['Medium (6-7.9)']++;
    } else {
      ranges['Low (0-5.9)']++;
    }
  });

  return ranges;
}

function getStatusBreakdown(companies: CompanyAnalysis[]) {
  const breakdown: Record<string, number> = {};
  companies.forEach(company => {
    breakdown[company.status] = (breakdown[company.status] || 0) + 1;
  });
  return breakdown;
}
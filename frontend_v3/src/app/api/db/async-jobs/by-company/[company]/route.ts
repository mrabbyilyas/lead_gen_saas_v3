// API route for checking async job status by company name
// This provides database-first job status checking for the enhanced async search

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { company: string } }
) {
  try {
    const companyName = decodeURIComponent(params.company);
    
    console.log(`🔍 API: Checking async job status for company: "${companyName}"`);
    
    // Use enhanced database method to check for completed analysis
    const completionStatus = await db.hasCompletedAnalysis(companyName);
    
    if (completionStatus.hasCompleted) {
      console.log(`✅ API: Found completed analysis for "${companyName}" from ${completionStatus.source}`);
      
      return NextResponse.json({
        success: true,
        data: {
          status: 'completed',
          found_in_database: true,
          source: completionStatus.source,
          result: completionStatus.data,
          company_name: companyName
        }
      });
    }
    
    // Check for ongoing async jobs
    const job = await db.getAsyncJobByCompanyName(companyName);
    
    if (!job) {
      console.log(`❌ API: No async job found for company: "${companyName}"`);
      return NextResponse.json({
        success: true,
        data: {
          status: 'not_found',
          found_in_database: false,
          company_name: companyName
        }
      });
    }
    
    console.log(`📊 API: Found async job for "${companyName}" with status: ${job.status}`);
    
    return NextResponse.json({
      success: true,
      data: {
        job_id: job.job_id,
        company_name: job.company_name,
        status: job.status,
        result: job.result,
        progress_message: job.progress_message,
        error_message: job.error_message,
        found_in_database: true,
        source: 'async_jobs_table',
        created_at: job.created_at,
        updated_at: job.updated_at
      }
    });
    
  } catch (error) {
    console.error('❌ API: Error checking async job status by company:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check job status',
      company_name: params.company
    }, { status: 500 });
  }
}
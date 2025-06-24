// API route for checking async job status by job ID
// This provides database-first job status checking for polling logic

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const jobId = params.jobId;
    
    console.log(`🔍 API: Checking specific job status by ID: ${jobId}`);
    
    // Check database first for job status
    const job = await db.getAsyncJobById(jobId);
    
    if (job) {
      console.log(`📊 API: Found job ${jobId} in database with status: ${job.status}`);
      
      // If job is completed or failed, return database result immediately
      if (job.status === 'completed' || job.status === 'failed') {
        console.log(`✅ API: Job ${jobId} has terminal status (${job.status}) - returning database result`);
        
        return NextResponse.json({
          success: true,
          data: {
            job_id: job.job_id,
            company_name: job.company_name,
            status: job.status,
            result: job.result,
            progress_message: job.progress_message,
            error_message: job.error_message,
            source: 'database',
            created_at: job.created_at,
            updated_at: job.updated_at
          }
        });
      }
      
      // For processing/pending jobs, return current database status
      // The frontend can decide whether to check backend API as fallback
      console.log(`🔄 API: Job ${jobId} status: ${job.status} (${job.progress_message || 'processing'})`);
      
      return NextResponse.json({
        success: true,
        data: {
          job_id: job.job_id,
          company_name: job.company_name,
          status: job.status,
          result: job.result,
          progress_message: job.progress_message,
          error_message: job.error_message,
          source: 'database',
          created_at: job.created_at,
          updated_at: job.updated_at
        }
      });
    }
    
    // Job not found in database
    console.log(`❌ API: Job ${jobId} not found in database`);
    
    return NextResponse.json({
      success: true,
      data: {
        job_id: jobId,
        status: 'not_found',
        source: 'database_check',
        found_in_database: false
      }
    });
    
  } catch (error) {
    console.error(`❌ API: Error checking specific job status for ${params.jobId}:`, error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check job status',
      job_id: params.jobId
    }, { status: 500 });
  }
}
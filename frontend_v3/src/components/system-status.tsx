// System status indicator component

"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, Database, Server, Wifi } from "lucide-react";

interface SystemStatus {
  database: 'connected' | 'error' | 'checking';
  backend: 'connected' | 'error' | 'checking';
  demoMode: boolean;
}

export function SystemStatusIndicator() {
  const [status, setStatus] = useState<SystemStatus>({
    database: 'checking',
    backend: 'checking',
    demoMode: false
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    // Check if we're in demo mode
    const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true';
    
    // Check database connection
    let dbStatus: 'connected' | 'error' = 'error';
    try {
      const dbResponse = await fetch('/api/test-db');
      dbStatus = dbResponse.ok ? 'connected' : 'error';
    } catch {
      dbStatus = 'error';
    }

    // Check backend API connection
    let backendStatus: 'connected' | 'error' = 'error';
    try {
      const backendResponse = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/health');
      backendStatus = backendResponse.ok ? 'connected' : 'error';
    } catch {
      backendStatus = 'error';
    }

    setStatus({
      database: dbStatus,
      backend: backendStatus,
      demoMode: isDemoMode
    });
  };

  const getStatusIcon = (serviceStatus: 'connected' | 'error' | 'checking') => {
    switch (serviceStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'checking':
        return <AlertCircle className="h-4 w-4 text-yellow-600 animate-pulse" />;
    }
  };

  const getStatusColor = (serviceStatus: 'connected' | 'error' | 'checking') => {
    switch (serviceStatus) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'checking':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const overallStatus = status.database === 'connected' && status.backend === 'connected' 
    ? 'connected' 
    : status.database === 'connected' 
    ? 'partial' 
    : 'error';

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={
              overallStatus === 'connected' 
                ? 'border-green-600 text-green-600' 
                : overallStatus === 'partial'
                ? 'border-yellow-600 text-yellow-600'
                : 'border-red-600 text-red-600'
            }
          >
            <Wifi className="h-3 w-3 mr-1" />
            {overallStatus === 'connected' 
              ? 'All Systems Operational' 
              : overallStatus === 'partial'
              ? 'Database Only'
              : status.demoMode 
              ? 'Demo Mode' 
              : 'System Error'
            }
          </Badge>
          {status.demoMode && (
            <Badge variant="secondary">
              <AlertCircle className="h-3 w-3 mr-1" />
              Demo Mode Active
            </Badge>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </Button>
      </div>

      {showDetails && (
        <Card className="mt-2">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Database Connection</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.database)}
                  <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(status.database)}`}>
                    {status.database === 'connected' ? 'Connected' : status.database === 'error' ? 'Error' : 'Checking...'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Backend API</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.backend)}
                  <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(status.backend)}`}>
                    {status.backend === 'connected' ? 'Connected' : status.backend === 'error' ? 'Error' : 'Checking...'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t text-xs text-muted-foreground">
                <p>Database: Real company data from Azure PostgreSQL</p>
                <p>Backend API: FastAPI with Gemini AI integration</p>
                {status.demoMode && (
                  <p className="text-yellow-600 font-medium">Demo mode: Using fallback authentication</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={checkSystemStatus}>
                  Refresh Status
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
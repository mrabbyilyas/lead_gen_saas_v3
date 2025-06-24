// Database test panel to verify direct PostgreSQL connection
// This helps debug and verify the database transition

"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Play,
  FileText,
  BarChart3,
  Users
} from "lucide-react";
// Removed direct database imports - using API calls instead
// All database operations now go through /api/db/* endpoints

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: any;
  duration?: number;
}

export function DatabaseTestPanel() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (name: string, updates: Partial<TestResult>) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { ...t, ...updates } : t);
      } else {
        return [...prev, { name, status: 'pending', message: '', ...updates }];
      }
    });
  };

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    const start = Date.now();
    updateTest(testName, { status: 'running', message: 'Running...' });
    
    try {
      const result = await testFn();
      const duration = Date.now() - start;
      updateTest(testName, {
        status: 'success',
        message: 'Passed',
        details: result,
        duration
      });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      updateTest(testName, {
        status: 'error',
        message: error instanceof Error ? error.message : 'Test failed',
        duration
      });
      throw error;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests([]);

    try {
      // Test 1: Environment Configuration (via health API)
      await runTest('Environment Config', async () => {
        const response = await fetch('/api/db/health');
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.data?.error || 'Health check failed');
        }
        const config = data.data.environment;
        if (!config.isValid) {
          throw new Error(`Missing variables: ${config.missingVars.join(', ')}`);
        }
        return config;
      });

      // Test 2: Basic Connection (via health API)
      await runTest('Database Connection', async () => {
        const response = await fetch('/api/db/health');
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.data?.error || 'Connection test failed');
        }
        const result = data.data.connection;
        if (!result.success) {
          throw new Error(result.message);
        }
        return result.details;
      });

      // Test 3: Pool Health (via health API)
      await runTest('Connection Pool Health', async () => {
        const response = await fetch('/api/db/health');
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.data?.error || 'Pool health check failed');
        }
        const health = data.data.pool;
        if (!health.isHealthy) {
          throw new Error(health.connectionTest?.message || 'Pool is not healthy');
        }
        return health;
      });

      // Test 4: Basic Query (Count)
      await runTest('Basic Query Test', async () => {
        const response = await fetch('/api/db/companies?limit=1&offset=0');
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Query test failed');
        }
        return {
          companiesFound: data.data.length,
          totalCount: data.total,
          hasMore: data.hasMore
        };
      });

      // Test 5: Search Query
      await runTest('Search Query Test', async () => {
        const response = await fetch('/api/db/companies?search=test&limit=5&offset=0');
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Search test failed');
        }
        return {
          searchTerm: 'test',
          resultsFound: data.data.length
        };
      });

      // Test 6: Dashboard Stats
      await runTest('Dashboard Stats', async () => {
        const response = await fetch('/api/db/stats');
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Stats test failed');
        }
        const stats = data.data;
        return {
          totalCompanies: stats.total_companies,
          highScoreLeads: stats.high_score_leads,
          averageScore: stats.average_score,
          successRate: stats.success_rate,
          recentCount: stats.recent_analyses_count,
          industriesFound: stats.industry_breakdown.length,
          scoreDistribution: stats.score_distribution.length
        };
      });

      // Test 7: Company Existence Check
      await runTest('Company Existence Check', async () => {
        // Check for Apple
        const appleResponse = await fetch('/api/db/companies?search=Apple&limit=1&offset=0');
        const appleData = await appleResponse.json();
        const existing = appleData.success && appleData.data.length > 0;
        
        // Check for non-existent company
        const fakeResponse = await fetch('/api/db/companies?search=NonExistentCompany12345&limit=1&offset=0');
        const fakeData = await fakeResponse.json();
        const nonExisting = fakeData.success && fakeData.data.length > 0;
        
        return {
          existingTest: existing ? 'Found' : 'Not found',
          nonExistingTest: nonExisting ? 'Unexpected result' : 'Correctly not found'
        };
      });

      // Test 8: Password Special Characters Validation
      await runTest('Password Special Characters', async () => {
        const response = await fetch('/api/db/health');
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.data?.error || 'Health check failed');
        }
        
        const passwordValidation = data.data.connection?.details?.passwordValidation;
        if (!passwordValidation) {
          throw new Error('Password validation data not available');
        }
        
        if (passwordValidation.length !== 16) {
          throw new Error(`Password length ${passwordValidation.length}, expected 16`);
        }
        
        if (!passwordValidation.hasSpecialChars) {
          throw new Error('Password missing expected special characters ($, ))');
        }
        
        return {
          length: passwordValidation.length,
          expectedLength: passwordValidation.expectedLength,
          hasSpecialChars: passwordValidation.hasSpecialChars,
          specialCharsFound: passwordValidation.specialCharsFound
        };
      });

      // Test 9: Query Performance Benchmark
      await runTest('Query Performance', async () => {
        // Test companies query performance
        const companiesStart = Date.now();
        const companiesResponse = await fetch('/api/db/companies?limit=10&offset=0');
        const companiesDuration = Date.now() - companiesStart;
        
        if (!companiesResponse.ok) {
          throw new Error('Companies query failed');
        }
        
        // Test stats query performance
        const statsStart = Date.now();
        const statsResponse = await fetch('/api/db/stats');
        const statsDuration = Date.now() - statsStart;
        
        if (!statsResponse.ok) {
          throw new Error('Stats query failed');
        }
        
        // Performance thresholds
        if (companiesDuration > 2000) {
          throw new Error(`Companies query too slow: ${companiesDuration}ms (should be <2000ms)`);
        }
        
        if (statsDuration > 3000) {
          throw new Error(`Stats query too slow: ${statsDuration}ms (should be <3000ms)`);
        }
        
        return {
          companiesQueryMs: companiesDuration,
          statsQueryMs: statsDuration,
          totalMs: companiesDuration + statsDuration,
          performanceGrade: (companiesDuration + statsDuration) < 1000 ? 'Excellent' : 
                          (companiesDuration + statsDuration) < 2000 ? 'Good' : 'Acceptable'
        };
      });

    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <Badge variant="secondary">Running</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-600">Passed</Badge>;
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const successCount = tests.filter(t => t.status === 'success').length;
  const failureCount = tests.filter(t => t.status === 'error').length;
  const totalTests = tests.length;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <CardTitle>Database Connection Test Suite</CardTitle>
          </div>
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className="gap-2"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Tests
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          Verify direct PostgreSQL connection and query functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Results Summary */}
        {tests.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{successCount}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{failureCount}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalTests}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {tests.length > 0 && (
          <div className="space-y-3">
            {tests.map((test, index) => (
              <div
                key={test.name}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <div className="font-medium">{test.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {test.message}
                      {test.duration && ` (${test.duration}ms)`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(test.status)}
                  {test.details && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log(`${test.name} details:`, test.details);
                        alert(`${test.name} details logged to console`);
                      }}
                    >
                      <FileText className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        {tests.length === 0 && (
          <Alert>
            <BarChart3 className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Test Suite Information</div>
              <div className="text-sm space-y-1">
                <p>• Environment configuration validation</p>
                <p>• PostgreSQL connection testing</p>
                <p>• Connection pool health checks</p>
                <p>• Basic and search query functionality</p>
                <p>• Dashboard statistics calculation</p>
                <p>• Company existence checking</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Environment Info */}
        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Test Mode:</strong> Database API Routes</p>
            <p><strong>Direct DB Mode:</strong> {process.env.NEXT_PUBLIC_USE_DIRECT_DB || 'false'}</p>
            <p><strong>Note:</strong> Environment details available in health check test results</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
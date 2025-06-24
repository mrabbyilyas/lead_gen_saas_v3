// API client for LeadIntel backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// API Response Types (matching OpenAPI schema)
export interface TokenRequest {
  client_id: string;
  client_secret: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface CompanySearchRequest {
  company_name: string;
}

export interface CompanySearchResponse {
  id: number;
  company_name: string;
  canonical_name: string | null;
  analysis_result: object;
  status: string;
  created_at: string;
}

export interface CompanyNotFoundResponse {
  error: string;
  message: string;
  suggestions?: string[] | null;
}

export interface AsyncJobResponse {
  job_id: string;
  status: string;
  progress_message?: string;
  created_at: string;
  estimated_completion?: string;
}

export interface AsyncJobStatus {
  job_id: string;
  status: string;
  progress_message?: string;
  result?: CompanySearchResponse;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

// API Client Class
class LeadIntelAPI {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
    }
  }

  // Set authentication token
  setAccessToken(token: string) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  // Get authentication headers
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  // Optimized API request handler with performance enhancements
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        ...this.getAuthHeaders(),
        'Accept-Encoding': 'gzip, br', // Request compression
        'Connection': 'keep-alive', // Reuse connections
      },
      // Add timeout for better UX
      signal: AbortSignal.timeout(30000), // 30 second timeout
      ...options,
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔗 Making API request to: ${url}`);
      }
      
      const response = await fetch(url, config);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📡 API Response status: ${response.status} ${response.statusText}`);
        
        // Log performance metrics in development
        const processTime = response.headers.get('X-Process-Time');
        if (processTime) {
          console.log(`⏱️ Server processing time: ${processTime}s`);
        }
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      const isJSON = contentType && contentType.includes('application/json');
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          if (isJSON) {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } else {
            // Handle HTML error pages (reduced logging in production)
            if (process.env.NODE_ENV === 'development') {
              const textResponse = await response.text();
              console.error('Non-JSON error response:', textResponse.substring(0, 200));
            }
            
            if (response.status === 502) {
              errorMessage = 'Backend service unavailable. Please try again in a moment.';
            } else if (response.status === 404) {
              errorMessage = 'Requested resource not found.';
            } else if (response.status === 500) {
              errorMessage = 'Server error. Please try again later.';
            } else if (response.status === 401) {
              errorMessage = 'Authentication required. Please log in again.';
            } else if (response.status === 403) {
              errorMessage = 'Access denied. Please check your permissions.';
            } else if (response.status >= 400 && response.status < 500) {
              errorMessage = 'Request error. Please check your input and try again.';
            }
          }
        } catch (parseError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error parsing error response:', parseError);
          }
        }
        
        throw new Error(errorMessage);
      }

      if (!isJSON) {
        throw new Error('Server returned invalid response format.');
      }

      const data = await response.json();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ API request successful: ${endpoint}`);
      }
      
      return data;
      
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Network error: Unable to connect to the server. Please check your internet connection.`);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ API request failed: ${endpoint}`, error);
      }
      
      throw error;
    }
  }

  // Authentication endpoints
  async getAccessToken(credentials: TokenRequest): Promise<TokenResponse> {
    return this.request<TokenResponse>('/auth/token', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // Company search endpoints
  async searchCompany(request: CompanySearchRequest): Promise<CompanySearchResponse | CompanyNotFoundResponse> {
    return this.request<CompanySearchResponse | CompanyNotFoundResponse>('/companies/search', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getCompanyAnalysis(companyId: number): Promise<CompanySearchResponse> {
    return this.request<CompanySearchResponse>(`/companies/${companyId}`);
  }

  // Async company search endpoints
  async searchCompanyAsync(request: CompanySearchRequest): Promise<AsyncJobResponse> {
    return this.request<AsyncJobResponse>('/companies/search/async', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getJobStatus(jobId: string): Promise<AsyncJobStatus> {
    return this.request<AsyncJobStatus>(`/companies/jobs/${jobId}/status`);
  }

  // Helper method for polling until completion
  async pollUntilComplete(
    jobId: string, 
    onProgress?: (status: AsyncJobStatus) => void,
    pollInterval: number = 5000,
    maxAttempts: number = 60 // 5 minutes max
  ): Promise<CompanySearchResponse> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const status = await this.getJobStatus(jobId);
      
      if (onProgress) {
        onProgress(status);
      }
      
      if (status.status === 'completed' && status.result) {
        return status.result;
      } else if (status.status === 'failed') {
        throw new Error(status.error_message || 'Job failed');
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    throw new Error('Job timed out after maximum attempts');
  }

  // Admin endpoints
  async updateGeminiKey(newKey: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/admin/gemini-key', {
      method: 'PUT',
      body: JSON.stringify({ new_gemini_api_key: newKey }),
    });
  }

  // Health check with enhanced diagnostics
  async healthCheck(): Promise<any> {
    try {
      console.log('🏥 Checking backend health...');
      const health = await this.request<any>('/health');
      console.log('✅ Backend is healthy:', health);
      return health;
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      throw error;
    }
  }

  // Test connectivity to backend
  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      await this.healthCheck();
      return { connected: true };
    } catch (error) {
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Unknown connection error'
      };
    }
  }
}

// Export singleton instance
export const api = new LeadIntelAPI();

// Export utility functions
export const auth = {
  login: async (clientId: string, clientSecret: string): Promise<TokenResponse> => {
    const response = await api.getAccessToken({ client_id: clientId, client_secret: clientSecret });
    api.setAccessToken(response.access_token);
    return response;
  },

  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('client_id');
    }
    api.setAccessToken('');
  },

  isAuthenticated: (): boolean => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('access_token');
    }
    return false;
  },

  getStoredToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }
};

export default api;
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

  // Generic API request handler
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
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

  // Admin endpoints
  async updateGeminiKey(newKey: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/admin/gemini-key', {
      method: 'PUT',
      body: JSON.stringify({ new_gemini_api_key: newKey }),
    });
  }

  // Health check
  async healthCheck(): Promise<any> {
    return this.request<any>('/health');
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
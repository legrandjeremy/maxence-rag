import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import { useAuthStore } from 'stores/authStore'
import { handleApiError } from 'src/utils/errorHandlers'

interface ApiConfig {
  baseURL?: string
  timeout?: number
}

class ApiService {
  private client: AxiosInstance

  static readonly SCOPE_ADMIN = 'maijin-defi-challenge:admin'
  static readonly SCOPE_USER = 'maijin-defi-challenge:user'
  static readonly SCOPE_MANAGER = 'maijin-defi-challenge:team-manager'
  static readonly SCOPES = [this.SCOPE_ADMIN, this.SCOPE_USER, this.SCOPE_MANAGER]

  constructor(config: ApiConfig = {}) {
    this.client = axios.create({
      baseURL: config.baseURL || process.env.API_URL || '',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor for auth
    this.client.interceptors.request.use(
      (config) => {
        const authStore = useAuthStore()
        if (authStore.token) {
          config.headers.Authorization = `Bearer ${authStore.token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(new Error(error))
      }
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        return Promise.reject(new Error(handleApiError(error)))
      }
    )
  }

  // HTTP Methods
  async get<T = unknown>(url: string, config?: Record<string, unknown>): Promise<AxiosResponse<{ data: T }>> {
    return this.client.get(url, config)
  }

  async post<T = unknown>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<AxiosResponse<{ data: T }>> {
    return this.client.post(url, data, config)
  }

  async put<T = unknown>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<AxiosResponse<{ data: T }>> {
    return this.client.put(url, data, config)
  }

  async patch<T = unknown>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<AxiosResponse<{ data: T }>> {
    return this.client.patch(url, data, config)
  }

  async delete<T = unknown>(url: string, config?: Record<string, unknown>): Promise<AxiosResponse<{ data: T }>> {
    return this.client.delete(url, config)
  }

  // Legacy method for backward compatibility
  async getUsers() {
    try {
      const response = await this.get('/api/users')
      return response.data
    } catch (error) {
      return handleApiError(error)
    }
  }

  // Utility methods
  setBaseURL(baseURL: string) {
    this.client.defaults.baseURL = baseURL
  }

  setTimeout(timeout: number) {
    this.client.defaults.timeout = timeout
  }
}

// Export singleton instance
export const api = new ApiService()
export default ApiService

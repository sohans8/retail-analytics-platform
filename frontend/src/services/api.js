/**
 * Centralized API service layer connecting to the FastAPI backend.
 * Base URL defaults to http://127.0.0.1:8000 (configurable via VITE_API_BASE_URL)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map(d => `${d.loc?.join('.') || 'param'}: ${d.msg}`).join('; ');
          } else if (errorData.detail && typeof errorData.detail === 'object') {
            errorMessage = JSON.stringify(errorData.detail);
          }
        } catch {
          errorMessage = response.statusText || errorMessage;
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      return await response.json();
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const networkError = new Error(
          `Unable to connect to FastAPI backend at ${this.baseUrl}. Please ensure the server is running on port 8000.`
        );
        networkError.status = 0;
        throw networkError;
      }
      throw err;
    }
  }

  // --- Backend Endpoints ---

  /**
   * Root API status check
   * GET /
   */
  async getRoot() {
    return this.request('/');
  }

  /**
   * Health and model status
   * GET /health
   */
  async getHealth() {
    return this.request('/health');
  }

  /**
   * Model evaluation metrics (R2, MAE, RMSE, WAPE)
   * GET /metrics
   */
  async getMetrics() {
    return this.request('/metrics');
  }

  /**
   * Features required by the model
   * GET /model/features
   */
  async getModelFeatures() {
    return this.request('/model/features');
  }

  /**
   * Historical validation predictions
   * GET /validation?limit={limit}
   */
  async getValidationPredictions(limit = 100) {
    return this.request(`/validation?limit=${encodeURIComponent(limit)}`);
  }

  /**
   * Recursive XGBoost sales forecasting for a store and future schedule
   * POST /forecast
   * @param {Object} payload: { store_id: number, horizon_weeks: number, future_schedule: Array<{ promo_days, school_holiday_days, state_holiday_days }> }
   */
  async generateForecast(payload) {
    return this.request('/forecast', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Direct model inference on feature records
   * POST /predict
   * @param {Object} payload: { records: Array<Object> }
   */
  async predictSales(payload) {
    return this.request('/predict', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiService(API_BASE_URL);
export default api;

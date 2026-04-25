// API client for GlowSphere with authentication support

// Use environment variable or fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5002/api";

class ApiClient {
  // Get token from localStorage
  getToken() {
    return localStorage.getItem("token");
  }

  // Set token in localStorage
  setToken(token) {
    localStorage.setItem("token", token);
  }

  // Remove token from localStorage
  removeToken() {
    localStorage.removeItem("token");
  }

  // Get headers with optional authentication
  getHeaders(includeAuth = false) {
    const headers = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async get(endpoint, authenticated = false) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: this.getHeaders(authenticated),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Request failed (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        // For 401 on protected endpoints (not auth endpoints), remove token
        if (response.status === 401) {
          const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
          if (!isAuthEndpoint) {
            this.removeToken();
            throw new Error("Authentication required. Please log in again.");
          }
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      // Re-throw with better error message for network errors
      if (
        error.message.includes("fetch") ||
        error.message.includes("Failed to fetch")
      ) {
        throw new Error(
          "Unable to connect to server. Please check your internet connection and ensure the backend is running."
        );
      }
      throw error;
    }
  }

  async post(endpoint, data, authenticated = false) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: this.getHeaders(authenticated),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Request failed (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        // For 401 on protected endpoints (not auth endpoints), remove token
        if (response.status === 401) {
          const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
          if (!isAuthEndpoint) {
            this.removeToken();
            throw new Error("Authentication required. Please log in again.");
          }
          // For login/register endpoints, use the backend's specific error message
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      // Re-throw with better error message for network errors
      if (
        error.message.includes("fetch") ||
        error.message.includes("Failed to fetch")
      ) {
        throw new Error(
          "Unable to connect to server. Please check your internet connection and ensure the backend is running."
        );
      }
      throw error;
    }
  }

  // Get API base URL for use in FormData uploads
  getApiBaseUrl() {
    return API_BASE_URL;
  }

  async put(endpoint, data, authenticated = false) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: this.getHeaders(authenticated),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Request failed (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        // For 401 on protected endpoints, remove token
        if (response.status === 401) {
          this.removeToken();
          throw new Error("Authentication required. Please log in again.");
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async delete(endpoint, authenticated = false) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: this.getHeaders(authenticated),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Request failed (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        // For 401 on protected endpoints, remove token
        if (response.status === 401) {
          this.removeToken();
          throw new Error("Authentication required. Please log in again.");
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }
}

export default new ApiClient();

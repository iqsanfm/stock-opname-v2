const API_BASE_URL = import.meta.env.VITE_API_URL;

// Add isFormData parameter
const apiCall = async (endpoint, method = 'GET', data = null, isFormData = false) => {
  const headers = {}; // Initialize headers as empty object

  // Only set Content-Type if it's not FormData
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config = {
    method,
    headers, // Use the headers object
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
    if (isFormData) {
      config.body = data; // Pass FormData directly
    } else {
      config.body = JSON.stringify(data); // Stringify for JSON data
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
      // Token expired or invalid, trigger logout
      const error = new Error('Unauthorized');
      error.statusCode = response.status;
      error.isAuthError = true; // Custom flag to identify auth errors
      throw error;
    }

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      let errorMessage = 'API Error';
      try {
        const errorResult = await response.json();
        errorMessage = errorResult.message || errorMessage;
      } catch (parseError) {
        // If we can't parse JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      const error = new Error(errorMessage);
      error.statusCode = response.status;
      throw error;
    }

    // Only try to parse JSON if response is ok
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      // If response is ok but not JSON, return success with empty data
      console.warn(`API response for ${endpoint} is not JSON, returning empty data`);
      return { success: true, data: null };
    }

    return result;
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};

export default apiCall;
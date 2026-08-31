import axios from 'axios';

function formatAxiosError(error) {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const errorData = error.response.data;
      
      let message = errorData?.message || 'Server error occurred';
      
      // Condense array of field errors into a single message string
      if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        message = errorData.errors
          .map((err) => `${err.field}: ${err.message}`)
          .join(', ');
      }

      return {
        status: error.response.status,
        message: message
      };
    } 
    
    if (error.request) {
      return {
        message: 'No response received from the server. Please check your internet connection.',
      };
    }
  }

  return {
    message: error.message || 'An unexpected error occurred',
  };
}

export default formatAxiosError;
import axios from 'axios';

/**
 * Transforms server, validation, and network errors into clear,
 * human-readable, user-friendly messages for mobile application screens.
 */
function formatAxiosError(error) {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const errorData = error.response.data;
      const status = error.response.status;

      let message = errorData?.message;

      // Cleanly format validation error lists without developer jargon
      if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        message = errorData.errors
          .map((err) => {
            if (!err) return '';
            const rawMsg = typeof err === 'string' ? err : err.message || '';
            const rawField = err.field ? String(err.field).replace(/^(body|query|params)\./, '') : '';
            
            // Clean up developer field names into human labels (e.g. courseCode -> Course Code)
            const humanField = rawField
              .replace(/([A-Z])/g, ' $1')
              .replace(/_/g, ' ')
              .trim()
              .replace(/^\w/, (c) => c.toUpperCase());

            if (humanField && !rawMsg.toLowerCase().includes(humanField.toLowerCase())) {
              return `${humanField}: ${rawMsg}`;
            }
            return rawMsg;
          })
          .filter(Boolean)
          .join('. ');
      }

      if (!message || typeof message !== 'string') {
        if (status === 401) {
          message = 'Your session has expired. Please sign in again.';
        } else if (status === 403) {
          message = 'You do not have permission to access this resource or perform this action.';
        } else if (status === 404) {
          message = 'The requested item or service could not be found.';
        } else if (status === 429) {
          message = 'Too many requests. Please pause for a few seconds and try again.';
        } else if (status >= 500) {
          message = 'Our servers are momentarily unavailable. Please try again in a few minutes.';
        } else {
          message = 'Something went wrong while processing your request. Please try again.';
        }
      }

      return {
        status,
        message,
      };
    }

    if (error.request) {
      return {
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
      };
    }
  }

  return {
    message: error?.message || 'An unexpected error occurred. Please try again.',
  };
}

export default formatAxiosError;

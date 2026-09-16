import axios from 'axios';
import { ApiRequestError } from './types';

export function normalizeApiError(error: unknown): ApiRequestError {
  if (error instanceof ApiRequestError) return error;
  if (axios.isAxiosError(error)) {
    const message = typeof error.message === 'string' && error.message.length > 0 ? error.message : 'The API request failed.';
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') return new ApiRequestError('timeout', message);
    if (error.response) {
      const status = error.response.status;
      if (status >= 400 && status < 500) return new ApiRequestError('http_4xx', message, status);
      if (status >= 500) return new ApiRequestError('http_5xx', message, status);
      return new ApiRequestError('malformed_response', 'The API returned an unexpected HTTP response.', status);
    }
    if (error.request) return new ApiRequestError('network', message);
  }
  return new ApiRequestError('unknown', 'An unexpected API error occurred.');
}

export function malformedResponseError(): ApiRequestError { return new ApiRequestError('malformed_response', 'The API returned malformed data.'); }

import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || '/api';

export const apiClient = axios.create({
  baseURL,
  timeout: 5_000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

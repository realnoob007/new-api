import { showError } from './utils';
import axios from 'axios';

export const API = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_SERVER_URL
    ? import.meta.env.VITE_REACT_APP_SERVER_URL
    : '',
});

API.interceptors.request.use((config) => {
  config.headers['accept-language'] =
    localStorage.getItem('i18nextLng') || 'zh';
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    showError(error);
  },
);

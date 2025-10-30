import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10_000
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Centralized error handling hook
    return Promise.reject(error)
  }
)



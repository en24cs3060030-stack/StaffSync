// Axios wrapper around the backend. "/api" is proxied to http://localhost:5000 (see vite.config.js).
// withCredentials sends the httpOnly login cookie with every request.
import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
})

// unwrap response.data and turn failures into plain Errors carrying the server message
http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const e = new Error(err.response?.data?.message || err.message || 'Something went wrong')
    e.status = err.response?.status
    return Promise.reject(e)
  },
)

// drop empty filters so "?status=&search=" is never sent
const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))

export const api = {
  get: (path, params) => http.get(path, { params: clean(params) }),
  post: (path, body) => http.post(path, body || {}),
  put: (path, body) => http.put(path, body || {}),
  del: (path) => http.delete(path),
}

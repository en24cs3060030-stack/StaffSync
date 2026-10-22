import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api } from '../api'

// On page load ask the backend who is logged in (reads the httpOnly cookie)
export const fetchMe = createAsyncThunk('auth/fetchMe', async () => (await api.get('/auth/me')).user)
export const login = createAsyncThunk('auth/login', async (body) => (await api.post('/auth/login', body)).user)
export const register = createAsyncThunk('auth/register', async (body) => (await api.post('/auth/register', body)).user)
export const logout = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout').catch(() => {})
})

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, loading: true }, // loading = still checking the cookie
  reducers: {
    setUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload; s.loading = false })
      .addCase(fetchMe.rejected, (s) => { s.user = null; s.loading = false })
      .addCase(login.fulfilled, (s, a) => { s.user = a.payload })
      .addCase(register.fulfilled, (s, a) => { s.user = a.payload })
      .addCase(logout.fulfilled, (s) => { s.user = null })
  },
})

export const { setUser } = authSlice.actions
export default authSlice.reducer

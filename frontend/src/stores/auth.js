import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('access_token'))
  
  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const userCredits = computed(() => user.value?.credits || 0)
  
  // Actions
  async function login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials)
      const { access_token, user: userData } = response.data
      
      token.value = access_token
      user.value = userData
      
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('user', JSON.stringify(userData))
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      }
    }
  }
  
  async function register(userData) {
    try {
      const response = await api.post('/auth/register', userData)
      const { access_token, user: newUser } = response.data
      
      token.value = access_token
      user.value = newUser
      
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('user', JSON.stringify(newUser))
      
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      }
    }
  }
  
  async function changePassword({ currentPassword, newPassword }) {
    try {
      const response = await api.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      })
      
      return { success: true, message: response.data?.message || 'Password changed successfully' }
    } catch (error) {
      let errorMessage = 'Failed to change password'
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.error || 'Invalid current password'
      } else if (error.response?.status === 422) {
        // Handle validation errors
        const validationErrors = error.response.data?.errors
        if (validationErrors) {
          errorMessage = Object.values(validationErrors).flat().join(', ')
        } else {
          errorMessage = error.response.data?.error || 'Password validation failed'
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'Current password is incorrect'
        // If unauthorized, the user might need to log in again
        logout()
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }
  
  async function fetchProfile() {
    try {
      const response = await api.get('/user/profile')
      user.value = response.data.user
      localStorage.setItem('user', JSON.stringify(response.data.user))
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      
      // If unauthorized, logout the user
      if (error.response?.status === 401) {
        logout()
      }
    }
  }
  
  async function updateProfile(profileData) {
    try {
      const response = await api.put('/user/profile', profileData)
      user.value = { ...user.value, ...response.data.user }
      localStorage.setItem('user', JSON.stringify(user.value))
      
      return { success: true, user: user.value }
    } catch (error) {
      let errorMessage = 'Failed to update profile'
      
      if (error.response?.status === 422) {
        // Handle validation errors
        const validationErrors = error.response.data?.errors
        if (validationErrors) {
          errorMessage = Object.values(validationErrors).flat().join(', ')
        } else {
          errorMessage = error.response.data?.error || 'Validation failed'
        }
      } else if (error.response?.status === 401) {
        logout()
        errorMessage = 'Authentication required'
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      }
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }
  
  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  }
  
  function initializeAuth() {
    const storedUser = localStorage.getItem('user')
    if (storedUser && token.value) {
      try {
        user.value = JSON.parse(storedUser)
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        logout()
      }
    }
  }
  
  return {
    user,
    token,
    isAuthenticated,
    userCredits,
    login,
    register,
    logout,
    fetchProfile,
    updateProfile,
    changePassword,
    initializeAuth
  }
})
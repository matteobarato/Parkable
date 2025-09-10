<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/auth/login" />
        </ion-buttons>
        <ion-title>Reset Password</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="forgot-password-container">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Forgot Password?</ion-card-title>
            <ion-card-subtitle>
              {{ step === 1 
                ? "Enter your email to receive reset instructions" 
                : "Enter the code sent to your email and your new password"
              }}
            </ion-card-subtitle>
          </ion-card-header>
          
          <ion-card-content>
            <!-- Step 1: Email Input -->
            <form v-if="step === 1" @submit.prevent="handleEmailSubmit">
              <ion-item>
                <ion-label position="stacked">Email Address</ion-label>
                <ion-input
                  v-model="form.email"
                  type="email"
                  required
                  :disabled="loading"
                  placeholder="Enter your registered email"
                />
              </ion-item>
              
              <ion-button
                expand="block"
                type="submit"
                :disabled="loading || !form.email"
                class="ion-margin-top"
              >
                <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                Send Reset Code
              </ion-button>
            </form>
            
            <!-- Step 2: Reset Code and New Password -->
            <form v-if="step === 2" @submit.prevent="handleResetSubmit">
              <ion-item>
                <ion-label position="stacked">Reset Code</ion-label>
                <ion-input
                  v-model="form.resetCode"
                  type="text"
                  required
                  :disabled="loading"
                  placeholder="Enter 6-digit code"
                  maxlength="6"
                />
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">New Password</ion-label>
                <ion-input
                  v-model="form.newPassword"
                  type="password"
                  required
                  :disabled="loading"
                  placeholder="Enter new password"
                />
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">Confirm New Password</ion-label>
                <ion-input
                  v-model="form.confirmPassword"
                  type="password"
                  required
                  :disabled="loading"
                  placeholder="Confirm new password"
                />
              </ion-item>
              
              <ion-button
                expand="block"
                type="submit"
                :disabled="loading || !isResetFormValid"
                class="ion-margin-top"
              >
                <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                Reset Password
              </ion-button>
              
              <ion-button
                fill="outline"
                expand="block"
                @click="resendCode"
                :disabled="loading || !canResend"
                class="ion-margin-top"
              >
                {{ canResend ? 'Resend Code' : `Resend in ${countdown}s` }}
              </ion-button>
            </form>
            
            <ion-button
              fill="clear"
              expand="block"
              @click="goToLogin"
              :disabled="loading"
              class="ion-margin-top"
            >
              Back to Login
            </ion-button>
            
            <ion-toast
              :is-open="showToast"
              :message="toastMessage"
              :color="toastColor"
              :duration="4000"
              @did-dismiss="showToast = false"
            />
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSpinner,
  IonToast
} from '@ionic/vue'

const router = useRouter()

// Reactive state
const step = ref(1) // 1: email input, 2: reset code and new password
const loading = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')
const countdown = ref(0)
const countdownInterval = ref(null)

const form = ref({
  email: '',
  resetCode: '',
  newPassword: '',
  confirmPassword: ''
})

// Computed properties
const isResetFormValid = computed(() => {
  return (
    form.value.resetCode &&
    form.value.newPassword &&
    form.value.confirmPassword &&
    form.value.newPassword === form.value.confirmPassword &&
    form.value.newPassword.length >= 6
  )
})

const canResend = computed(() => countdown.value === 0)

// Methods
const showMessage = (message, color = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  showToast.value = true
}

const goToLogin = () => {
  router.push('/auth/login')
}

const startCountdown = () => {
  countdown.value = 60
  countdownInterval.value = setInterval(() => {
    countdown.value--
    if (countdown.value === 0) {
      clearInterval(countdownInterval.value)
    }
  }, 1000)
}

const handleEmailSubmit = async () => {
  loading.value = true
  
  try {
    const response = await api.post('/auth/forgot-password', {
      email: form.value.email
    })
    
    if (response.data.success) {
      showMessage('Reset code sent to your email!')
      step.value = 2
      startCountdown()
    } else {
      showMessage(response.data.error || 'Failed to send reset code', 'danger')
    }
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Failed to send reset code'
    if (error.response?.status === 404) {
      showMessage('Email address not found', 'danger')
    } else {
      showMessage(errorMessage, 'danger')
    }
  } finally {
    loading.value = false
  }
}

const handleResetSubmit = async () => {
  if (form.value.newPassword !== form.value.confirmPassword) {
    showMessage('Passwords do not match', 'danger')
    return
  }
  
  if (form.value.newPassword.length < 6) {
    showMessage('Password must be at least 6 characters long', 'danger')
    return
  }
  
  loading.value = true
  
  try {
    const response = await api.post('/auth/reset-password', {
      email: form.value.email,
      resetCode: form.value.resetCode,
      newPassword: form.value.newPassword
    })
    
    if (response.data.success) {
      showMessage('Password reset successfully! You can now login with your new password.')
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } else {
      showMessage(response.data.error || 'Failed to reset password', 'danger')
    }
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'Failed to reset password'
    if (error.response?.status === 400) {
      showMessage('Invalid or expired reset code', 'danger')
    } else {
      showMessage(errorMessage, 'danger')
    }
  } finally {
    loading.value = false
  }
}

const resendCode = async () => {
  if (!canResend.value) return
  
  loading.value = true
  
  try {
    const response = await api.post('/auth/forgot-password', {
      email: form.value.email
    })
    
    if (response.data.success) {
      showMessage('New reset code sent!')
      startCountdown()
    } else {
      showMessage('Failed to resend code', 'danger')
    }
  } catch (error) {
    showMessage('Failed to resend code', 'danger')
  } finally {
    loading.value = false
  }
}

// Cleanup
onUnmounted(() => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
  }
})
</script>

<style scoped>
.forgot-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

ion-card {
  width: 100%;
  max-width: 400px;
}
</style>
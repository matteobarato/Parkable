<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/auth/login" />
        </ion-buttons>
        <ion-title>Create Account</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="register-container">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Register</ion-card-title>
            <ion-card-subtitle>Create your parking spot finder account</ion-card-subtitle>
          </ion-card-header>
          
          <ion-card-content>
            <ion-row class="ion-align-content-center ion-justify-content-center">
              <ion-col class="ion-margin-horizontal ion-margin-bottom">
                <img class="max-h-1/3" src="/icons/park_secure.png"/>
              </ion-col>
            </ion-row>

            <form @submit.prevent="handleSubmit">
              <ion-item>
                <ion-label position="stacked">Username</ion-label>
                <ion-input
                  v-model="form.username"
                  type="text"
                  required
                  :disabled="loading"
                  placeholder="Choose a username"
                />
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">Email</ion-label>
                <ion-input
                  v-model="form.email"
                  type="email"
                  required
                  :disabled="loading"
                  placeholder="Enter your email"
                />
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">Password</ion-label>
                <ion-input
                  v-model="form.password"
                  type="password"
                  required
                  :disabled="loading"
                  placeholder="Create a password"
                />
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">Confirm Password</ion-label>
                <ion-input
                  v-model="form.confirmPassword"
                  type="password"
                  required
                  :disabled="loading"
                  placeholder="Confirm your password"
                />
              </ion-item>
              
              <ion-item>
                <ion-checkbox v-model="form.agreeTerms" :disabled="loading" />
                <ion-label class="ion-margin-start">
                  I agree to the Terms of Service and Privacy Policy
                </ion-label>
              </ion-item>
              
              <ion-button
                expand="block"
                type="submit"
                :disabled="loading || !isFormValid"
                class="ion-margin-top"
              >
                <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                Create Account
              </ion-button>
              
              <ion-button
                fill="clear"
                expand="block"
                @click="goToLogin"
                :disabled="loading"
              >
                Already have an account? Login
              </ion-button>
            </form>
            
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
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
  IonToast,
  IonCheckbox
} from '@ionic/vue'

const router = useRouter()
const authStore = useAuthStore()

// Reactive state
const loading = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

// Computed properties
const isFormValid = computed(() => {
  return (
    form.value.username &&
    form.value.email &&
    form.value.password &&
    form.value.confirmPassword &&
    form.value.password === form.value.confirmPassword &&
    form.value.agreeTerms &&
    form.value.password.length >= 6
  )
})

// Methods
const showMessage = (message, color = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  showToast.value = true
}

const goToLogin = () => {
  router.push('/auth/login')
}

const validateForm = () => {
  if (form.value.password !== form.value.confirmPassword) {
    showMessage('Passwords do not match', 'danger')
    return false
  }
  
  if (form.value.password.length < 6) {
    showMessage('Password must be at least 6 characters long', 'danger')
    return false
  }
  
  if (!form.value.agreeTerms) {
    showMessage('You must agree to the Terms of Service', 'danger')
    return false
  }
  
  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    const result = await authStore.register({
      username: form.value.username,
      email: form.value.email,
      password: form.value.password
    })
    
    if (result.success) {
      showMessage('Registration successful! Welcome aboard!')
      setTimeout(() => {
        router.push('/map')
      }, 1500)
    } else {
      showMessage(result.error, 'danger')
    }
  } catch (error) {
    showMessage('An unexpected error occurred during registration', 'danger')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}

ion-card {
  width: 100%;
  max-width: 400px;
}

ion-checkbox {
  margin-right: 8px;
}
</style>
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Parking Spot Finder</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="login-container">
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ isLogin ? 'Login' : 'Register' }}</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <form @submit.prevent="handleSubmit">
              <ion-item v-if="!isLogin">
                <ion-label position="stacked">Username</ion-label>
                <ion-input
                  v-model="form.username"
                  type="text"
                  required
                  :disabled="loading"
                />
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">
                  {{ isLogin ? 'Username/Email' : 'Email' }}
                </ion-label>
                <ion-input
                  v-model="form.identifier"
                  :type="isLogin ? 'text' : 'email'"
                  required
                  :disabled="loading"
                />
              </ion-item>
              
              <ion-item>
                <ion-label position="stacked">Password</ion-label>
                <ion-input
                  v-model="form.password"
                  type="password"
                  required
                  :disabled="loading"
                />
              </ion-item>
              
              <ion-button
                expand="block"
                type="submit"
                :disabled="loading"
                class="ion-margin-top"
              >
                <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                {{ isLogin ? 'Login' : 'Register' }}
              </ion-button>
              
              <ion-button
                fill="clear"
                expand="block"
                @click="toggleMode"
                :disabled="loading"
              >
                {{ isLogin ? 'Need an account? Register' : 'Have an account? Login' }}
              </ion-button>
            </form>
            
            <ion-toast
              :is-open="showToast"
              :message="toastMessage"
              :color="toastColor"
              :duration="3000"
              @did-dismiss="showToast = false"
            />
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSpinner,
  IonToast
} from '@ionic/vue'

const router = useRouter()
const authStore = useAuthStore()

// Reactive state
const isLogin = ref(true)
const loading = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const form = ref({
  username: '',
  identifier: '',
  password: ''
})

// Methods
const toggleMode = () => {
  isLogin.value = !isLogin.value
  form.value = { username: '', identifier: '', password: '' }
}

const showMessage = (message, color = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  showToast.value = true
}

const handleSubmit = async () => {
  loading.value = true
  
  try {
    let result
    
    if (isLogin.value) {
      result = await authStore.login({
        username: form.value.identifier,
        password: form.value.password
      })
    } else {
      result = await authStore.register({
        username: form.value.username,
        email: form.value.identifier,
        password: form.value.password
      })
    }
    
    if (result.success) {
      showMessage(isLogin.value ? 'Login successful!' : 'Registration successful!')
      router.push('/map')
    } else {
      showMessage(result.error, 'danger')
    }
  } catch (error) {
    showMessage('An unexpected error occurred', 'danger')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
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
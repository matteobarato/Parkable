<template>
  <ion-card>
    <ion-card-header>
      <ion-card-title>Change Password</ion-card-title>
    </ion-card-header>
    <ion-card-content>
      <form @submit.prevent="handleSubmit">
        <ion-item>
          <ion-input
            v-model="currentPassword"
            type="password"
            label="Current Password"
            label-placement="stacked"
            :class="{ 'ion-invalid': errors.currentPassword }"
            error-text="Current password is required"
            required
          />
        </ion-item>
        
        <ion-item>
          <ion-input
            v-model="newPassword"
            type="password"
            label="New Password"
            label-placement="stacked"
            :class="{ 'ion-invalid': errors.newPassword }"
            :error-text="errors.newPassword"
            required
          />
        </ion-item>
        
        <ion-item>
          <ion-input
            v-model="confirmPassword"
            type="password"
            label="Confirm New Password"
            label-placement="stacked"
            :class="{ 'ion-invalid': errors.confirmPassword }"
            :error-text="errors.confirmPassword"
            required
          />
        </ion-item>
        
        <!-- Password strength indicator -->
        <div v-if="newPassword" class="password-strength">
          <ion-text color="medium">
            <small>Password Strength: </small>
          </ion-text>
          <ion-badge :color="strengthColor">{{ strengthText }}</ion-badge>
          
          <div class="strength-requirements">
            <ion-text color="medium">
              <small>Requirements:</small>
            </ion-text>
            <ul class="requirements-list">
              <li :class="{ valid: hasMinLength }">
                <ion-icon :icon="hasMinLength ? checkmarkOutline : closeOutline" />
                At least 8 characters
              </li>
              <li :class="{ valid: hasUppercase }">
                <ion-icon :icon="hasUppercase ? checkmarkOutline : closeOutline" />
                One uppercase letter
              </li>
              <li :class="{ valid: hasLowercase }">
                <ion-icon :icon="hasLowercase ? checkmarkOutline : closeOutline" />
                One lowercase letter
              </li>
              <li :class="{ valid: hasNumber }">
                <ion-icon :icon="hasNumber ? checkmarkOutline : closeOutline" />
                One number
              </li>
              <li :class="{ valid: hasSpecialChar }">
                <ion-icon :icon="hasSpecialChar ? checkmarkOutline : closeOutline" />
                One special character (!@#$%^&*)
              </li>
            </ul>
          </div>
        </div>
        
        <div class="ion-margin-top">
          <ion-button
            type="submit"
            expand="block"
            :disabled="!isFormValid || isLoading"
          >
            <ion-spinner v-if="isLoading" name="crescent" />
            <span v-else>Change Password</span>
          </ion-button>
        </div>
        
        <ion-text v-if="message" :color="messageType">
          <p class="ion-text-center">{{ message }}</p>
        </ion-text>
      </form>
    </ion-card-content>
  </ion-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonText,
  IonBadge,
  IonIcon,
  IonSpinner
} from '@ionic/vue'
import { checkmarkOutline, closeOutline } from 'ionicons/icons'

const authStore = useAuthStore()

// Form data
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// UI state
const isLoading = ref(false)
const message = ref('')
const messageType = ref('success')

// Form validation
const errors = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Password strength validation
const hasMinLength = computed(() => newPassword.value.length >= 8)
const hasUppercase = computed(() => /[A-Z]/.test(newPassword.value))
const hasLowercase = computed(() => /[a-z]/.test(newPassword.value))
const hasNumber = computed(() => /\d/.test(newPassword.value))
const hasSpecialChar = computed(() => /[!@#$%^&*]/.test(newPassword.value))

const passwordStrength = computed(() => {
  if (!newPassword.value) return 0
  
  let strength = 0
  if (hasMinLength.value) strength++
  if (hasUppercase.value) strength++
  if (hasLowercase.value) strength++
  if (hasNumber.value) strength++
  if (hasSpecialChar.value) strength++
  
  return strength
})

const strengthColor = computed(() => {
  switch (passwordStrength.value) {
    case 0:
    case 1:
    case 2:
      return 'danger'
    case 3:
      return 'warning'
    case 4:
      return 'primary'
    case 5:
      return 'success'
    default:
      return 'medium'
  }
})

const strengthText = computed(() => {
  switch (passwordStrength.value) {
    case 0:
    case 1:
    case 2:
      return 'Weak'
    case 3:
      return 'Fair'
    case 4:
      return 'Good'
    case 5:
      return 'Strong'
    default:
      return 'None'
  }
})

const isFormValid = computed(() => {
  return currentPassword.value &&
         newPassword.value &&
         confirmPassword.value &&
         passwordStrength.value >= 3 &&
         newPassword.value === confirmPassword.value &&
         !Object.values(errors.value).some(error => error)
})

// Validation watchers
watch(currentPassword, (value) => {
  errors.value.currentPassword = !value ? 'Current password is required' : ''
})

watch(newPassword, (value) => {
  if (!value) {
    errors.value.newPassword = 'New password is required'
  } else if (passwordStrength.value < 3) {
    errors.value.newPassword = 'Password is too weak'
  } else if (value === currentPassword.value) {
    errors.value.newPassword = 'New password must be different from current password'
  } else {
    errors.value.newPassword = ''
  }
  
  // Re-validate confirm password when new password changes
  if (confirmPassword.value) {
    validateConfirmPassword()
  }
})

watch(confirmPassword, validateConfirmPassword)

function validateConfirmPassword() {
  if (!confirmPassword.value) {
    errors.value.confirmPassword = 'Please confirm your new password'
  } else if (confirmPassword.value !== newPassword.value) {
    errors.value.confirmPassword = 'Passwords do not match'
  } else {
    errors.value.confirmPassword = ''
  }
}

async function handleSubmit() {
  if (!isFormValid.value) return
  
  isLoading.value = true
  message.value = ''
  
  try {
    const result = await authStore.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    })
    
    if (result.success) {
      message.value = 'Password changed successfully!'
      messageType.value = 'success'
      
      // Reset form
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
    } else {
      message.value = result.error
      messageType.value = 'danger'
    }
  } catch (error) {
    message.value = 'An unexpected error occurred'
    messageType.value = 'danger'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.password-strength {
  margin-top: 12px;
  padding: 12px;
  background-color: var(--ion-color-light);
  border-radius: 8px;
}

.strength-requirements {
  margin-top: 8px;
}

.requirements-list {
  list-style: none;
  padding: 0;
  margin: 8px 0 0 0;
}

.requirements-list li {
  display: flex;
  align-items: center;
  padding: 2px 0;
  font-size: 0.875rem;
  color: var(--ion-color-danger);
  transition: color 0.2s ease;
}

.requirements-list li.valid {
  color: var(--ion-color-success);
}

.requirements-list li ion-icon {
  margin-right: 8px;
  font-size: 16px;
}

.ion-invalid {
  --border-color: var(--ion-color-danger);
}
</style>
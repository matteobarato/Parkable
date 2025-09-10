<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Parking Spots</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$router.push('/profile')">
            <ion-icon name="person" />
            {{ authStore.userCredits }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content>
      <div class="map-container">
        <TheMap
          :spots="spots"
          @spot-chosen="handleSpotChosen"
          @spot-reported="handleSpotReported"
          @add-spot="handleAddSpot"
        />
      </div>
      
      <!-- Floating Action Button -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="submitSpot" :disabled="!userLocation || submittingSpot">
          <ion-spinner v-if="submittingSpot" name="crescent" />
          <ion-icon v-else name="add" />
        </ion-fab-button>
      </ion-fab>
      
      <!-- Toast for messages -->
      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :color="toastColor"
        :duration="3000"
        @did-dismiss="showToast = false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'
import TheMap from '@/components/TheMap.vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonSpinner,
  IonToast
} from '@ionic/vue'

const authStore = useAuthStore()

// Reactive state
const spots = ref([])
const userLocation = ref(null)
const submittingSpot = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

// Methods
const showMessage = (message, color = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  showToast.value = true
}

const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  })
}

const fetchSpots = async () => {
  try {
    const response = await api.get('/spots')
    spots.value = response.data.spots
  } catch (error) {
    showMessage('Failed to load parking spots', 'danger')
  }
}

const submitSpot = async () => {
  if (!userLocation.value) {
    showMessage('Unable to get your location', 'danger')
    return
  }
  
  submittingSpot.value = true
  
  try {
    const response = await api.post('/spots', {
      latitude: userLocation.value.latitude,
      longitude: userLocation.value.longitude,
      user_latitude: userLocation.value.latitude,
      user_longitude: userLocation.value.longitude
    })
    
    spots.value.push(response.data.spot)
    await authStore.fetchProfile()
    showMessage('Parking spot added successfully!')
  } catch (error) {
    showMessage(error.response?.data?.error || 'Failed to add spot', 'danger')
  } finally {
    submittingSpot.value = false
  }
}

const handleSpotChosen = async (spotId) => {
  try {
    const response = await api.post(`/spots/${spotId}/choose`)
    
    // Update local spots array
    const spotIndex = spots.value.findIndex(s => s.id === spotId)
    if (spotIndex !== -1) {
      spots.value[spotIndex] = response.data.spot
    }
    
    await authStore.fetchProfile()
    showMessage('Spot chosen successfully!')
  } catch (error) {
    showMessage(error.response?.data?.error || 'Failed to choose spot', 'danger')
  }
}

const handleSpotReported = async (spotId) => {
  try {
    await api.post(`/spots/${spotId}/report`)
    showMessage('Spot reported successfully!')
    await fetchSpots() // Refresh spots
  } catch (error) {
    showMessage('Failed to report spot', 'danger')
  }
}

const handleAddSpot = (location) => {
  userLocation.value = location
  submitSpot()
}

// Lifecycle
onMounted(async () => {
  try {
    userLocation.value = await getCurrentLocation()
    await fetchSpots()
    await authStore.fetchProfile()
  } catch (error) {
    showMessage('Please enable location services', 'warning')
  }
})
</script>

<style scoped>
.map-container {
  height: 100%;
  width: 100%;
}
</style>
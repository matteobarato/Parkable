<template>
  <ion-page>
    <!-- <ion-header>
      <ion-toolbar>
        <ion-title>Parking Spots</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$router.push('/profile')">
            {{ authStore.userCredits }}&nbsp;&nbsp;<Coins :size="32" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header> -->
    
    <ion-content>
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-container">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <ion-text color="medium">
          <p>Loading parking spots...</p>
        </ion-text>
      </div>

      <!-- Main Content -->
      <div v-else class="content-container">
        <ion-button @click="$router.push('/profile')" class="btn-tl absolute btn-icon" shape="round" color="light">
          <CircleUser :size="32"/>
        </ion-button>
        <ion-button class="btn-credits btn-tr absolute btn-small-padding animate__animated animate__pulse" shape="round">
          {{ authStore.userCredits }}&nbsp;&nbsp;<Coins :size="32" />
        </ion-button>
        <div id="map-footer" class="absolute btn-br">
          <div id="map-controls" class="flex ion-align-content-center ion-flex-column ion-justify-content-center animate__animated animate__fadeInUp">
            <div id="map-controls-left" class="flex ion-align-content-center ion-flex-column ion-justify-content-center">
            <ion-button @click="isSpotsListOpened = !isSpotsListOpened" class="btn-icon-padd ion-margin" shape="round" color="light">
              <span class="flex ion-align-items-center"  v-if="!isSpotsListOpened">
                <ChevronUp :size="16" />
                <SquareParking :size="24" />
              </span>
              <span class="flex ion-align-items-center" v-else>
                <ChevronDown :size="16" />
                <SquareParkingOff :size="24" />
              </span>
            </ion-button>
            <ion-button class="btn-icon-padd tertiary" shape="round">
              <MapPinPlus :size="24" />
            </ion-button>
            <ion-button @click="setCenterToCurrentLocation()" class="btn-icon-padd ion-margin" shape="round" color="light">
              <Locate v-if="!userLocationLoading" :size="36" />
              <LocateFixed v-else :size="36" />
            </ion-button>
            </div>
          </div>

          <div id="map-spots-list" :class="{'active': isSpotsListOpened, 'inactive': !isSpotsListOpened}">
            <!-- Spots List -->
            <div class="spots-list">
              <ParkingSpotCard
                v-for="(spot, index) in sortedAndFilteredSpots"
                :key="spot.id"
                :spot="spot"
                :ranking="getRanking(spot, index)"
                :distance="getSpotDistance(spot)"
                :is-selected="selectedSpotId === spot.id"
                :show-actions="true"
                :show-navigate-button="!!userLocation"
                @spot-selected="handleListSpotSelected"
                @choose-spot="handleSpotChosen"
                @report-spot="handleSpotReported"
                @navigate-to-spot="handleNavigateToSpot"
              />
            </div>
          </div>

        </div>
        
        <!-- Map View -->
        <div 
          v-show="currentView === 'map' || currentView === 'hybrid'" 
          class="map-container"
          :class="{ 'hybrid-map': currentView === 'hybrid' }"
        >
          <TheMap
            :spots="sortedAndFilteredSpots"
            :mapCenter="mapCenter"
            :userLocation="userLocation"
            :user-location="userLocation"
            :selected-spot-id="selectedSpotId"
            @spot-chosen="handleSpotChosen"
            @spot-reported="handleSpotReported"
            @spot-selected="handleMapSpotSelected"
            @add-spot="handleAddSpot"
          />
          
          <!-- Location Status Overlay -->
          <div v-if="!userLocation" class="location-overlay">
            <ion-card class="location-card">
              <ion-card-content>
                <div class="location-status">
                  <MapPin :size="24" color="var(--ion-color-warning)" />
                  <div>
                    <h3>Location Required</h3>
                    <p>Enable location to see nearest spots</p>
                    <ion-button fill="outline" size="small" @click="requestLocation">
                      Enable Location
                    </ion-button>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          </div>
        </div>

        <!-- Spots List -->
        <div class="spots-container">

          <!-- Empty State -->
          <div v-if="sortedAndFilteredSpots.length === 0" class="empty-state">
            <div class="empty-content">
              <Search :size="48" color="var(--ion-color-medium)" />
              <h3>No spots found</h3>
              <p>No parking spots available in this area</p>
            </div>
          </div>

          <!-- Spots List -->
          <div v-else class="spots-list">
            <ParkingSpotCard
              v-for="(spot, index) in sortedAndFilteredSpots"
              :key="spot.id"
              :spot="spot"
              :ranking="getRanking(spot, index)"
              :distance="getSpotDistance(spot)"
              :is-selected="selectedSpotId === spot.id"
              :show-actions="true"
              :show-navigate-button="!!userLocation"
              @spot-selected="handleListSpotSelected"
              @choose-spot="handleSpotChosen"
              @report-spot="handleSpotReported"
              @disable-spot="handleSpotDisabled"
              @navigate-to-spot="handleNavigateToSpot"
            />
          </div>

          <!-- Load More Button -->
          <div v-if="hasMoreSpots" class="load-more-container">
            <ion-button 
              fill="outline" 
              expand="block" 
              @click="loadMoreSpots"
              :disabled="isLoadingMore"
            >
              <ion-spinner v-if="isLoadingMore" name="crescent" />
              <span v-else>Load More Spots</span>
            </ion-button>
          </div>
        </div>
      </div>

      <ion-modal class="modal-selected-spot-details" :is-open="showSpotDetailsCard" @did-dismiss="showSpotDetailsCard = false">
          <ion-item lines="none" class="ion-margin-top ion-padding-bottom" style="--background:var(--ion-color-light)">
            <h2>Spot #{{ selectedSpot?.id }}</h2>
            <ion-button slot="end" fill="clear" @click="showSpotDetailsCard = false">
              <X :size="24" />
            </ion-button>
          </ion-item>
          <ParkingSpotCardDetails
            style="height: 100%;"
            v-if="selectedSpot"
            :spot="selectedSpot"
            :distance="getSpotDistance(selectedSpot)"
            :show-actions="true"
            :show-navigate-button="!!userLocation"
            @choose-spot="handleSpotChosen"
            @report-spot="handleSpotReported"
            @navigate-to-spot="handleNavigateToSpot"
          />
      </ion-modal>
      
      <!-- Toast for messages -->
      <ion-toast
        :is-open="showToast"
        :message="toastMessage"
        :color="toastColor"
        :duration="3000"
        @did-dismiss="showToast = false"
      />

      <!-- Pull to Refresh -->
      <ion-refresher slot="fixed" @ionRefresh="handlePullRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, defineEmits, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { actionSheetController, alertController } from '@ionic/vue'
import api from '@/services/api'
import TheMap from '@/components/TheMap.vue'
import ParkingSpotCard from '@/components/ParkingSpotCard.vue'
import { 
  Coins, 
  MapPinPlus, 
  MapPin, 
  Navigation, 
  Clock, 
  Search, 
  ArrowUpDown, 
  Filter, 
  RotateCcw,
  X,
  CircleUser,
  Locate,
  SquareParking,
  SquareParkingOff,
  ChevronUp,
  ChevronDown,
  LocateFixed
} from 'lucide-vue-next'
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
  IonToast,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardContent,
  IonText,
  IonBadge,
  IonModal,
  IonRefresher,
  IonRefresherContent
} from '@ionic/vue'
import ParkingSpotCardDetails from '../components/ParkingSpotCardDetails.vue'

const authStore = useAuthStore()

// Reactive state
const spots = ref([])
const userLocation = ref(null)
const submittingSpot = ref(false)
const userLocationLoading = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')
const isLoading = ref(true)
const isRefreshing = ref(false)
const isLoadingMore = ref(false)
const isSpotsListOpened = ref(true)

// View state
const currentView = ref('map')
const selectedSpotId = ref(null)
const selectedSpot = ref(null)
const showQuickInfo = ref(false)
const showSpotDetailsCard = ref(false)

const mapCenter = ref({latitude:null, longitude:null})

// Sorting and filtering
const sortBy = ref('distance') // 'distance', 'time', 'status'
const sortOrder = ref('asc')
const statusFilter = ref('all') // 'all', 'new', 'chosen'
const maxDistance = ref(10000) // 5km in meters
const showOnlyFresh = ref(false) // spots less than 1 hour old

// Pagination
const currentPage = ref(1)
const spotsPerPage = 20

let intervalUpdateUserLocation = null

// Computed properties
const hasMoreSpots = computed(() => {
  return spots.value.length > currentPage.value * spotsPerPage
})

const sortedAndFilteredSpots = computed( () => {
  let filtered = [...spots.value]

  if (userLocation.value && maxDistance.value) {
    filtered = filtered.filter(spot => {
      const distance = calculateDistance(
        userLocation.value.latitude,
        userLocation.value.longitude,
        spot.latitude,
        spot.longitude
      )
      return distance <= maxDistance.value
    })
  }

  filtered.map(spot=>{
    if (!spot.timestamp.includes('Z')){
      spot.timestamp += 'Z'
    }
    spot['computedDistanceMeters'] = getSpotDistance(spot)
    spot['elapsedTimeSeconds'] = (new Date().getTime() - new Date(spot.timestamp).getTime()) / 1000;

    let rank_best = 4
    let rank_time = 4
    let rank_distance = 4

    if ( spot['computedDistanceMeters'] < 250) rank_distance = 1 // 250m
    else if ( spot['computedDistanceMeters'] < 500) rank_distance = 2 // 500m
    else if ( spot['computedDistanceMeters'] < 1000) rank_distance = 3 // 1km
    else rank_distance = 4

    if ( spot['elapsedTimeSeconds'] < 10*60) rank_time = 1 // 10min
    else if ( spot['elapsedTimeSeconds'] < 20*60) rank_time = 2 // 20min
    else if ( spot['elapsedTimeSeconds'] < 45*60) rank_time = 3 // 45min
    else rank_distance = 4

    rank_best = Math.round((rank_distance + rank_time ) / 2)
    
    spot['rankBest'] = rank_best
    spot['rankTime'] = rank_time
    spot['rankDistance'] = rank_distance
    return spot
  })

  filtered.sort((a,b)=>{
    return a['rankBest'] - b['rankBest']
  })
  console.log("Filtered spts:", filtered)
  return filtered
})

// Utility functions
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
           Math.cos(φ1) * Math.cos(φ2) *
           Math.sin(Δλ/2) * Math.sin(Δλ/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

  return R * c
}

const getSpotDistance = (spot) => {
  if (!userLocation.value) return null
  return calculateDistance(
    userLocation.value.latitude,
    userLocation.value.longitude,
    spot.latitude,
    spot.longitude
  )
}

const getRanking = (spot, index) => {
  if (sortBy.value === 'distance' && userLocation.value) {
    return index + 1
  }
  return null
}

// Methods
const showMessage = (message, color = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  showToast.value = true
}

const setCenterToCurrentLocation = async ()=>{
    userLocationLoading.value = true
    try {
      let location = await getCurrentLocation()
      if (location){
        mapCenter.value = {latitude: location.latitude, longitude: location.longitude}
      }
    }finally{
      setTimeout(_=>{userLocationLoading.value = false}, 1000)
    }
}

const requestLocation = async () => {
  try {
    userLocation.value = await getCurrentLocation()
    mapCenter.value = userLocation.value
    showMessage('Location enabled successfully!', 'success')
  } catch (error) {
    showMessage('Failed to get location. Please check your settings.', 'danger')
  }
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
    const params = {}
    if (userLocation.value) {
      params.user_latitude = userLocation.value.latitude
      params.user_longitude = userLocation.value.longitude
      params.radius = 10000 // 10km radius
    }
    
    const response = await api.get('/spots', { params })
    spots.value = response.data.spots
  } catch (error) {
    showMessage('Failed to load parking spots', 'danger')
  }
}

const refreshSpots = async () => {
  isRefreshing.value = true
  try {
    await fetchSpots()
    showMessage('Spots refreshed!', 'success')
  } catch (error) {
    showMessage('Failed to refresh spots', 'danger')
  } finally {
    isRefreshing.value = false
  }
}

const handlePullRefresh = async (event) => {
  await refreshSpots()
  event.target.complete()
}

const loadMoreSpots = () => {
  isLoadingMore.value = true
  setTimeout(() => {
    currentPage.value++
    isLoadingMore.value = false
  }, 500)
}

const submitSpot = async (location) => {
  if (!userLocation.value) {
    showMessage('Unable to get your location', 'danger')
    return
  }
  
  submittingSpot.value = true
  
  try {
    const response = await api.post('/spots', {
      latitude: location.latitude,
      longitude: location.longitude,
      // user_latitude: userLocation.value.latitude, // TODO: restore control
      // user_longitude: userLocation.value.longitude
      user_latitude: location.latitude,
      user_longitude: location.longitude
    })
    
    spots.value.unshift(response.data.spot) // Add to beginning for newest first
    await authStore.fetchProfile()
    showMessage('Parking spot added successfully!')
  } catch (error) {
    showMessage(error.response?.data?.error || 'Failed to add spot', 'danger')
  } finally {
    submittingSpot.value = false
  }
}

const handleSpotChosen = async (spot) => {
  try {
    const response = await api.post(`/spots/${spot.id}/choose`)
    
    // Update local spots array
    const spotIndex = spots.value.findIndex(s => s.id === spot.id)
    if (spotIndex !== -1) {
      spots.value[spotIndex] = response.data.spot
    }
    
    await authStore.fetchProfile()
    showMessage('Spot chosen successfully!')
    showQuickInfo.value = false
  } catch (error) {
    showMessage(error.response?.data?.error || 'Failed to choose spot', 'danger')
  }
}

const handleSpotReported = async (spot) => {
  try {
    await api.post(`/spots/${spot.id}/report`)
    showMessage('Spot reported successfully!')
    await fetchSpots() // Refresh spots
    showQuickInfo.value = false
  } catch (error) {
    showMessage('Failed to report spot', 'danger')
  }
}

const handleSpotDisabled = async (spot) => {
  const alert = await alertController.create({
    header: 'Remove Spot',
    message: 'Are you sure you want to remove this parking spot?',
    buttons: [
      'Cancel',
      {
        text: 'Remove',
        role: 'destructive',
        handler: async () => {
          try {
            await api.delete(`/spots/${spot.id}`)
            spots.value = spots.value.filter(s => s.id !== spot.id)
            showMessage('Spot removed successfully!', 'success')
          } catch (error) {
            showMessage('Failed to remove spot', 'danger')
          }
        }
      }
    ]
  })
  await alert.present()
}

const handleMapSpotSelected = (spot) => {
  selectedSpot.value = spot
  selectedSpotId.value = spot.id
  showQuickInfo.value = true
}

const handleListSpotSelected = (spot) => {
  selectedSpotId.value = spot.id
  selectedSpot.value = spot
  
  mapCenter.value = {latitude: selectedSpot.value.latitude, longitude: selectedSpot.value.longitude}
  toggleSpotDetailsCard()
  
}

const handleNavigateToSpot = (spot) => {
  if (userLocation.value) {
    const url = `https://www.google.com/maps/dir/${userLocation.value.latitude},${userLocation.value.longitude}/${spot.latitude},${spot.longitude}`
    window.open(url, '_blank')
  }
}

const handleAddSpot = (location) => {
  submitSpot(location)
}

const toggleSpotDetailsCard = () => {
  showSpotDetailsCard.value = !showSpotDetailsCard.value
  console.log("showSpotDetailsCard:", showSpotDetailsCard.value)
}

// Lifecycle
onMounted(async () => {
  try {
    userLocation.value = await getCurrentLocation()
  } catch (error) {
    console.warn('Location not available:', error)
  }
  intervalUpdateUserLocation = setInterval(async ()=>{
    try {
      userLocation.value = await getCurrentLocation()
    } catch (error) {
      console.warn('Location not available:', error)
    }
  }, 1000)
  await fetchSpots()
  await authStore.fetchProfile()
  isLoading.value = false
})

onUnmounted(()=>{
  if (intervalUpdateUserLocation) {
    clearInterval(intervalUpdateUserLocation)
  }
})
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  gap: 1rem;
}

.content-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.view-controls {
  padding: 12px;
  border-bottom: 1px solid var(--ion-color-light);
  background: var(--ion-color-light-tint);
}

.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  gap: 8px;
}

.control-btn {
  --padding-start: 8px;
  --padding-end: 8px;
  height: 32px;
  font-size: 0.875rem;
}

.filter-badge {
  margin-left: 4px;
  font-size: 0.6rem;
}

.map-container {
  height: 100%;
  position: relative;
}

.map-container.hybrid-map {
  height: 50%;
  flex-shrink: 0;
}

.location-overlay {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 1000;
}

.location-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.location-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.location-status h3 {
  margin: 0 0 4px 0;
  font-size: 1rem;
}

.location-status p {
  margin: 0 0 8px 0;
  color: var(--ion-color-medium);
  font-size: 0.875rem;
}

.spots-container {
  position: fixed;
  width: 100%;
  height: auto;
  bottom: 0px;
}

.stats-header {
  display: flex;
  justify-content: space-around;
  padding: 12px;
  background: var(--ion-color-light-tint);
  border-bottom: 1px solid var(--ion-color-light);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: var(--ion-color-medium);
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60%;
  padding: 2rem;
}

.empty-content {
  text-align: center;
}

.empty-content h3 {
  margin: 1rem 0 0.5rem 0;
  color: var(--ion-color-medium);
}

.empty-content p {
  margin-bottom: 1rem;
  color: var(--ion-color-medium);
}

.spots-list {
  display: flex;
  overflow-x: scroll;
  padding: 8px 12px;
}

.load-more-container {
  padding: 16px 12px;
}

.fab-adjusted {
  --transform: translateY(-60px);
}

.quick-info-container {
  padding: 20px;
}

.quick-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.quick-info-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.parking-spot-card{
  min-width: 15em;
  margin-left: 10px;
  padding: .5em;
}

/* Responsive Design */
@media (max-width: 768px) {
  .controls-row {
    flex-wrap: wrap;
    gap: 4px;
  }
  
  .control-btn {
    font-size: 0.75rem;
  }
  
  .stats-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .stat-item {
    justify-content: flex-start;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .view-controls {
    background: var(--ion-color-dark-tint);
    border-bottom-color: var(--ion-color-dark-shade);
  }
  
  .stats-header {
    background: var(--ion-color-dark-tint);
    border-bottom-color: var(--ion-color-dark-shade);
  }
  
  .location-card {
    background: rgba(0, 0, 0, 0.9);
  }
}
</style>
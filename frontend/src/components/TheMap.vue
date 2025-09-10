<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { IonIcon } from '@ionic/vue';
import { add, person } from 'ionicons/icons';
import L from 'leaflet'
import '../services/MovinMarker.js'

// Props
const props = defineProps({
  spots: {
    type: Array,
    default: () => []
  },
  mapCenter: {
    type: Object,
    default: () => null
  },
  userLocation: {
    type: Object,
    default: () => null
  }
})

// Emits
const emit = defineEmits(['spot-chosen', 'spot-reported', 'add-spot'])

// Reactive state
const mapContainer = ref(null)
let map = null
let markers = []
let userMarker = null

// Fix Leaflet default markers
// delete L.Icon.Default.prototype._getIconUrl
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
//   iconUrl: require('leaflet/dist/images/marker-icon.png'),
//   shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
// })



// Methods
const initMap = () => {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value, {zoomControl:false}).setView([37.7749, -122.4194], 13,) // San Francisco default

  setTimeout(function () {
    map.invalidateSize()
  }, 1000)

  var CartoDB_VoyagerLabelsUnder = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  });


  CartoDB_VoyagerLabelsUnder.addTo(map)

  // Get user location and center map
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        map.setView([latitude, longitude], 18)

        // Add user location marker
        if (userMarker) {
          map.removeLayer(userMarker)
        }

        userMarker = L.Marker.movingMarker(
          [[latitude, longitude], [latitude, longitude]], [20000],
          {
            icon: L.icon({
              iconUrl: '/icons/location.png',
              iconSize: [80, 80],
              iconAnchor: [40,40]
            })
          })
        userMarker.addTo(map).bindPopup('Your Location');

      },
      (error) => {
        console.error('Geolocation error:', error)
      }
    )
  }

  // Add double-click handler for adding spots
  map.on('dblclick', (e) => {
    emit('add-spot', {
      latitude: e.latlng.lat,
      longitude: e.latlng.lng
    })
  })
}

const clearMarkers = () => {
  markers.forEach(marker => map.removeLayer(marker))
  markers = []
}

const addSpotMarkers = () => {
  clearMarkers()
  console.log('Update spot markers:', props.spots)
  props.spots.forEach(spot => {
    if (spot.status !== 'new') return

    const marker = L.marker([spot.latitude, spot.longitude], {
      icon: L.icon({
        iconUrl: `/icons/spot-${spot.rankTime}.png`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      })
    }).addTo(map)

    // Create popup content
    const popupContent = `
      <div class="spot-popup">
        <h4>Parking Spot</h4>
        <p><strong>Shared by:</strong> ${spot.submitter_username}</p>
        <p><strong>Time:</strong> ${new Date(spot.timestamp).toLocaleString()}</p>
        <div class="popup-actions">
          <button class="choose-btn" data-spot-id="${spot.id}">Choose (1 credit)</button>
          <button class="report-btn" data-spot-id="${spot.id}">Report</button>
        </div>
      </div>
    `

    marker.bindPopup(popupContent)
    markers.push(marker)
  })

  // Add event listeners for popup buttons
  setTimeout(() => {
    document.querySelectorAll('.choose-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const spotId = parseInt(e.target.dataset.spotId)
        emit('spot-chosen', spotId)
      })
    })

    document.querySelectorAll('.report-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const spotId = parseInt(e.target.dataset.spotId)
        emit('spot-reported', spotId)
      })
    })
  }, 100)
}

const updateCenterMap = () => {
  if (props.mapCenter.latitude && props.mapCenter.longitude) {
    map.setView([props.mapCenter.latitude, props.mapCenter.longitude], 18)
  }
}

const updateUserLocation = () => {
  const latitude = props.userLocation.latitude
  const longitude = props.userLocation.longitude
  if (userMarker && latitude && longitude) {
    userMarker.moveTo([latitude, longitude], [1000])
  }
  if (!userMarker) {
    userMarker = L.Marker.movingMarker(
      [[latitude, longitude], [latitude, longitude]], [20000],
      {
        icon: L.icon({
          iconUrl: '/icons/location.png',
          iconSize: [80, 80],
          iconAnchor: [40, 40]
        })
      })
    userMarker.addTo(map).bindPopup('Your Location');
  }
}

// Watch for spots changes
watch(() => props.spots, addSpotMarkers, { deep: true })
watch(() => props.mapCenter, updateCenterMap, { deep: true })
watch(() => props.userLocation, updateUserLocation, { deep: true })

// Lifecycle
onMounted(() => {
  initMap()
  addSpotMarkers()
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})
</script>

<style>
.map-container {
  height: 100%;
  width: 100%;
}

/* Popup styles */
.spot-popup {
  min-width: 200px;
}

.spot-popup h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.spot-popup p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.popup-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.choose-btn,
.report-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
}

.choose-btn {
  background-color: #22c55e;
  color: white;
}

.choose-btn:hover {
  background-color: #16a34a;
}

.report-btn {
  background-color: #ef4444;
  color: white;
}

.report-btn:hover {
  background-color: #dc2626;
}
</style>
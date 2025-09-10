<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'

// Props
const props = defineProps({
  spots: {
    type: Array,
    default: () => []
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
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
})

// Methods
const initMap = () => {
  if (!mapContainer.value) return
  
  map = L.map(mapContainer.value).setView([37.7749, -122.4194], 13) // San Francisco default
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)
  
  // Get user location and center map
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        map.setView([latitude, longitude], 15)
        
        // Add user location marker
        if (userMarker) {
          map.removeLayer(userMarker)
        }
        
        userMarker = L.marker([latitude, longitude], {
          icon: L.icon({
            iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMwMDdBRkYiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })
        }).addTo(map).bindPopup('Your Location')
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
  
  props.spots.forEach(spot => {
    if (spot.status !== 'new') return
    
    const marker = L.marker([spot.latitude, spot.longitude], {
      icon: L.icon({
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMyMkMzNTUiLz4KPHA+UDwvcD4KPC9zdmc+',
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

// Watch for spots changes
watch(() => props.spots, addSpotMarkers, { deep: true })

// Lifecycle
onMounted(() => {
  initMap()
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

.choose-btn, .report-btn {
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
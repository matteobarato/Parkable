<template>
  <ion-card>
    <ion-card-header>
      <ion-card-title>Parking Spot</ion-card-title>
      <ion-card-subtitle>Shared by {{ spot.submitter_username }}</ion-card-subtitle>
    </ion-card-header>
    
    <ion-card-content>
      <p><strong>Location:</strong> {{ spot.latitude.toFixed(6) }}, {{ spot.longitude.toFixed(6) }}</p>
      <p><strong>Status:</strong> {{ formatStatus(spot.status) }}</p>
      <p><strong>Time:</strong> {{ formatTime(spot.timestamp) }}</p>
      <p v-if="spot.reports > 0"><strong>Reports:</strong> {{ spot.reports }}</p>
      
      <div class="spot-actions" v-if="spot.status === 'new'">
        <ion-button
          @click="$emit('choose-spot', spot.id)"
          color="success"
          :disabled="!canChoose"
        >
          Choose (1 credit)
        </ion-button>
        
        <ion-button
          @click="$emit('report-spot', spot.id)"
          color="danger"
          fill="outline"
        >
          Report
        </ion-button>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton
} from '@ionic/vue'

const authStore = useAuthStore()

// Props
const props = defineProps({
  spot: {
    type: Object,
    required: true
  }
})

// Emits
defineEmits(['choose-spot', 'report-spot'])

// Computed
const canChoose = computed(() => authStore.userCredits > 0)

// Methods
const formatStatus = (status) => {
  const statusMap = {
    'new': 'Available',
    'chosen': 'Chosen',
    'occupied': 'Occupied',
    'disabled': 'Disabled'
  }
  return statusMap[status] || status
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}
</script>

<style scoped>
.spot-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
</style>
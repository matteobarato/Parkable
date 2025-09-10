<template>
  <ion-card class="parking-spot-card-details" :class="['parking-spot-card-rank-'+spot.rankTime]" @click="$emit('spot-selected', spot)" button>

    <ion-card-content>

      <ion-list lines="none">
        <ion-item>
          <ion-text slot="start" class="icon-rank">
            <CircleDot :size="22" />
          </ion-text>
          <ion-card-title>{{ elapsedText }} ago</ion-card-title>
        </ion-item>
        <ion-item >
          <ion-text slot="start" color="medium"><Route :size="18" /></ion-text>
          <ion-text color="medium">{{ formattedDistance }}</ion-text>
        </ion-item>
        <ion-item >
          <ion-text slot="start" color="medium"><MapPinned :size="18" /></ion-text>
          <ion-text color="medium">{{ formattedCoordinates }}</ion-text>
        </ion-item>
        <ion-item >
          <ion-text slot="start" color="medium"><Calendar :size="18" /></ion-text>
          <ion-text color="medium">{{ formattedTimestamp }}</ion-text>
        </ion-item>
      </ion-list>

      <div class="flex ion-align-center ion-justify-content-around ion-padding-vertical ion-margin-vertical">
        <ion-button size="large" class="btn-go" shape="round">
          <div class="inline-flex ion-align-items-center">
            <ion-text>Go</ion-text>
            <ArrowRight :size="24" />
          </div>
        </ion-button>
      </div>
    </ion-card-content>

  </ion-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  IonCard,
  IonCardContent,
  IonItem,
  IonText,
  IonList,
  IonCardTitle,
  IonButton
} from '@ionic/vue'
import {
  MapPin,
  Navigation,
  Navigation2,
  User,
  Flag,
  Clock,
  Check,
  X,
  Trophy,
  Medal,
  Hash,
  Crown,
  Circle,
  XCircle,
  CheckCircle,
  UserCheck,
  CalendarPlus2,
  CircleArrowDown,
  CircleArrowUp,
  Goal,
  CircleDot,
  ArrowRight,
  Route,
  EllipsisVertical,
  CircleEllipsis,
  Info,
  Calendar,
  MapPinned
} from 'lucide-vue-next'
import { ellipsisVerticalCircle } from 'ionicons/icons'

const props = defineProps({
  spot: {
    type: Object,
    required: true
  },
  ranking: {
    type: Number,
    default: null
  },
  distance: {
    type: Number, // in meters
    default: null
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  showActions: {
    type: Boolean,
    default: false
  },
  showNavigateButton: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'spot-selected',
  'choose-spot',
  'report-spot',
  'disable-spot',
  'navigate-to-spot'
])

const authStore = useAuthStore()

// Computed properties
const isUserOwned = computed(() => {
  return authStore.user && props.spot.submitter_id === authStore.user.id
})

const statusColor = computed(() => {
  const colors = {
    'new': '#22c55e',      // green
    'chosen': '#3b82f6',   // blue
    'occupied': '#ef4444', // red
    'disabled': '#6b7280'  // gray
  }
  return colors[props.spot.status] || colors.new
})

const statusIcon = computed(() => {
  const icons = {
    'new': Circle,
    'chosen': UserCheck,
    'occupied': XCircle,
    'disabled': XCircle
  }
  return icons[props.spot.status] || Circle
})

const statusText = computed(() => {
  const texts = {
    'new': 'Available',
    'chosen': 'Reserved',
    'occupied': 'Occupied',
    'disabled': 'Unavailable'
  }
  return texts[props.spot.status] || 'Unknown'
})

const rankingColor = computed(() => {
  if (!props.ranking) return 'medium'
  if (props.ranking === 1) return 'warning' // gold
  if (props.ranking <= 3) return 'secondary' // silver/bronze
  if (props.ranking <= 5) return 'primary'
  return 'medium'
})

const formattedTimestamp = computed(() => {
  const date = new Date(props.spot.timestamp)
  const now = new Date()
  const diffInMinutes = Math.floor((now - date) / (1000 * 60))


  return date.toLocaleDateString(navigator.language, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const formattedCoordinates = computed(() => {
  const lat = props.spot.latitude.toFixed(4)
  const lng = props.spot.longitude.toFixed(4)
  return `${lat}, ${lng}`
})

const formattedDistance = computed(() => {
  if (!props.distance && props.distance !== 0) return ''
  if (props.distance < 1000) return `${Math.round(props.distance)}m`
  return `${(props.distance / 1000).toFixed(1)}km`
})

const freshnessClass = computed(() => {
  const date = new Date(props.spot.timestamp)
  const now = new Date()
  const diffInMinutes = Math.floor((now - date) / (1000 * 60))

  if (diffInMinutes < 15) return 'fresh'
  if (diffInMinutes < 60) return 'recent'
  if (diffInMinutes < 240) return 'moderate'
  return 'old'
})

const freshnessText = computed(() => {
  const date = new Date(props.spot.timestamp)
  const now = new Date()
  const diffInMinutes = Math.floor((now - date) / (1000 * 60))

  if (diffInMinutes < 15) return 'Fresh'
  if (diffInMinutes < 60) return 'Recent'
  if (diffInMinutes < 240) return 'Moderate'
  return 'Old'
})

const elapsedText = computed(() => {
  const date = new Date(props.spot.timestamp)
  const now = new Date()
  return getHumanReadableDateDifference(date, now)
})

// Action permissions
const canChoose = computed(() => {
  return props.spot.status === 'new' && !isUserOwned.value
})

const canReport = computed(() => {
  return !isUserOwned.value && props.spot.status !== 'disabled'
})

const canDisable = computed(() => {
  return isUserOwned.value && props.spot.status !== 'disabled'
})

// Action handlers
const chooseSpot = () => {
  emit('choose-spot', props.spot)
}

const reportSpot = () => {
  emit('report-spot', props.spot)
}

const disableSpot = () => {
  emit('disable-spot', props.spot)
}

const navigateToSpot = () => {
  emit('navigate-to-spot', props.spot)
}

function getHumanReadableDateDifference(date1, date2) {
  // Calculate the absolute difference in milliseconds
  const diffMs = Math.abs(date1.getTime() - date2.getTime());

  // Convert milliseconds to seconds, minutes, hours, and days
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let result = [];

  // Prioritize larger units first
  if (days > 0) {
    result.push(`${days} day${days > 1 ? 's' : ''}`);
  }
  if (days) return result.join(" ");

  if (hours % 24 > 0) {
    const remainingHours = hours % 24;
    result.push(`${remainingHours} h`);
  }

  if (minutes % 60 > 0) {
    result.push(`${minutes % 60} min`);
  }
  // Handle the case where the difference is 0 or very small (less than a second)
  if (result.length === 0) {
    return "0 min";
  }

  // Join the parts with a space
  return result.join(" ");
}


</script>

<style scoped>
.parking-spot-card {
  position: relative;
  margin: 8px 0;
  border-radius: 12px;
  /* transition: all 0.3s ease; */
  cursor: pointer;
  overflow: visible;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.parking-spot-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.parking-spot-card.selected {
  border: 2px solid var(--ion-color-primary);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
}

/* Status-based styling */
.parking-spot-card.status-new {
  border-top: 3px solid #22c55e;
}

.parking-spot-card.status-chosen {
  border-top: 3px solid #3b82f6;
}

.parking-spot-card.status-occupied {
  border-top: 3px solid #ef4444;
  opacity: 0.7;
}

.parking-spot-card.status-disabled {
  border-top: 3px solid #6b7280;
  opacity: 0.6;
}

/* Status Indicator */
.status-indicator {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  z-index: 2;
}

.status-dot {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-indicator.status-new .status-dot {
  background: #22c55e;
}

.status-indicator.status-chosen .status-dot {
  background: #3b82f6;
}

.status-indicator.status-occupied .status-dot {
  background: #ef4444;
}

.status-indicator.status-disabled .status-dot {
  background: #6b7280;
  animation: none;
}

/* Badges */
.ranking-badge {
  position: absolute;
  top: 1px;
  right: 12px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  font-size: 0.75rem;
}

.distance-badge {
  position: absolute;
  bottom: 1px;
  right: 12px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
}

/* Card Content */
.card-content {
  padding: 16px;
  padding-left: 32px;
  /* Account for status indicator */
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.spot-info {
  flex: 1;
}

.spot-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.spot-id {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--ion-color-dark);
}

.spot-meta .timestamp {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
}

.status-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.status-chip.chip-new {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.status-chip.chip-chosen {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.status-chip.chip-occupied {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.status-chip.chip-disabled {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

/* Location Row */
.location-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.coordinates {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.navigate-btn {
  --padding-start: 4px;
  --padding-end: 4px;
  margin: 0;
}

/* Bottom Row */
.bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.submitter {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--ion-color-medium);
}

.owner-badge {
  font-size: 0.6rem;
  display: flex;
  align-items: center;
  gap: 2px;
}

.reports-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--ion-color-warning);
}

/* Action Bar */
.action-bar {
  display: flex;
  gap: 6px;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--ion-color-light);
}

.action-btn {
  --padding-start: 8px;
  --padding-end: 8px;
  height: 28px;
  font-size: 0.75rem;
}

/* Freshness Indicator */
.freshness-indicator {
  position: absolute;
  bottom: 8px;
  left: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.6rem;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 500;
}

.freshness-indicator.fresh {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.freshness-indicator.recent {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.freshness-indicator.moderate {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.freshness-indicator.old {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
}

/* Animations */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 currentColor;
    opacity: 1;
  }

  70% {
    box-shadow: 0 0 0 8px transparent;
    opacity: 0;
  }

  100% {
    box-shadow: 0 0 0 0 transparent;
    opacity: 0;
  }
}

/* Responsive Design */
@media (max-width: 576px) {
  .header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .location-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .action-bar {
    flex-wrap: wrap;
  }

  .ranking-badge,
  .distance-badge {
    font-size: 0.7rem;
  }
}
</style>
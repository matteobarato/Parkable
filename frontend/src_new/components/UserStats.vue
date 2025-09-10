<template>
  <ion-card>
    <ion-card-header>
      <ion-card-title>Your Statistics</ion-card-title>
    </ion-card-header>
    
    <ion-card-content>
      <div class="stats-grid">
        <div class="stat-item">
          <ion-icon name="wallet" color="primary" />
          <div class="stat-content">
            <h3>{{ user.credits }}</h3>
            <p>Credits</p>
          </div>
        </div>
        
        <div class="stat-item">
          <ion-icon name="location" color="success" />
          <div class="stat-content">
            <h3>{{ user.spots_shared }}</h3>
            <p>Spots Shared</p>
          </div>
        </div>
        
        <div class="stat-item">
          <ion-icon name="car" color="tertiary" />
          <div class="stat-content">
            <h3>{{ user.spots_found }}</h3>
            <p>Spots Found</p>
          </div>
        </div>
        
        <div class="stat-item">
          <ion-icon name="trophy" color="warning" />
          <div class="stat-content">
            <h3>{{ user.credits_earned }}</h3>
            <p>Credits Earned</p>
          </div>
        </div>
        
        <div class="stat-item">
          <ion-icon name="star" color="danger" />
          <div class="stat-content">
            <h3>{{ user.reputation.toFixed(1) }}</h3>
            <p>Reputation</p>
          </div>
        </div>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup>
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon
} from '@ionic/vue'

// Props
defineProps({
  user: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: var(--ion-color-light);
  border-radius: 8px;
}

.stat-content h3 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: var(--ion-color-dark);
}

.stat-content p {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: var(--ion-color-medium);
}

ion-icon {
  font-size: 32px;
}
</style>
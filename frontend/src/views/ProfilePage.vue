<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/map" />
        </ion-buttons>
        <ion-title>Profile</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshProfile" :disabled="isLoading">
            <ion-icon :icon="refreshOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-segment value="account">
        <ion-segment-button value="account" content-id="account">
          <ion-label>Account</ion-label>
        </ion-segment-button>
        <ion-segment-button value="history" content-id="history">
          <ion-label>History</ion-label>
        </ion-segment-button>
      </ion-segment>

      <!-- Initial Loading State -->
      <div v-if="isLoading && !authStore.user" class="loading-container">
        <div class="loading-content">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
          <ion-text color="medium">
            <p>Loading your profile...</p>
          </ion-text>
        </div>
      </div>

      <ion-segment-view>
        <ion-segment-content id="account">
          <!-- Profile Content -->
          <div v-if="!isLoading && authStore.user" class="profile-content ion-margin-top">
            <!-- User Header Card -->
            <ion-card class="user-header-card animate__animated animate__pulse">
              <ion-card-content>
                <div class="user-header">
                  <div class="avatar-container">
                    <div class="avatar">
                      <User :size="48" />
                    </div>
                    <ion-badge v-if="authStore.user.is_premium" color="warning" class="premium-badge">
                      <Crown :size="12" />
                      Premium
                    </ion-badge>
                  </div>
                  <div class="user-info" color="light">
                    <h2>{{ authStore.user.username }}</h2>
                    <ion-text color="light">
                      <p>{{ authStore.user.email }}</p>
                    </ion-text>
                    <ion-text color="light" class="member-since">
                      <Calendar :size="14" />
                      Member since {{ formatDate(authStore.user.created_at) }}
                    </ion-text>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>

            <!-- User Stats Card -->
            <UserStats v-if="authStore.user" :user="authStore.user" />

            <!-- Quick Actions -->
            <ion-card class="quick-actions-card">
              <ion-card-header>
                <ion-card-title>
                  <Zap :size="20" />
                  Quick Actions
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <div class="quick-actions-grid">
                  <ion-button fill="clear" size="large" class="quick-action-btn" @click="editProfile">
                    <div class="quick-action-content">
                      <Edit3 :size="24" />
                      <span>Edit Profile</span>
                    </div>
                  </ion-button>
                  <ion-button fill="clear" size="large" class="quick-action-btn" @click="toggleNotifications">
                    <div class="quick-action-content">
                      <Bell :size="24" />
                      <span>Notifications</span>
                    </div>
                  </ion-button>
                  <ion-button fill="clear" size="large" class="quick-action-btn" @click="viewAchievements">
                    <div class="quick-action-content">
                      <Trophy :size="24" />
                      <span>Achievements</span>
                    </div>
                  </ion-button>
                  <ion-button fill="clear" size="large" class="quick-action-btn" @click="viewSettings">
                    <div class="quick-action-content">
                      <Settings :size="24" />
                      <span>Settings</span>
                    </div>
                  </ion-button>
                </div>
              </ion-card-content>
            </ion-card>

            <!-- Account Information -->
            <ion-card class="account-info-card">
              <ion-card-header>
                <ion-card-title>
                  <UserCheck :size="20" />
                  Account Information
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-list lines="none">
                  <ion-item>
                    <div class="info-item">
                      <div class="info-icon">
                        <User :size="20" />
                      </div>
                      <div class="info-content">
                        <ion-label>
                          <h3>Username</h3>
                          <p>{{ authStore.user.username }}</p>
                        </ion-label>
                      </div>
                    </div>
                  </ion-item>

                  <ion-item>
                    <div class="info-item">
                      <div class="info-icon">
                        <Mail :size="20" />
                      </div>
                      <div class="info-content">
                        <ion-label>
                          <h3>Email Address</h3>
                          <p>{{ authStore.user.email }}</p>
                        </ion-label>
                      </div>
                      <div class="email-status">
                        <ion-badge v-if="authStore.user.email_verified" color="success">
                          <CheckCircle2 :size="12" />
                          Verified
                        </ion-badge>
                        <!-- <ion-badge v-else color="warning">
                      <AlertCircle :size="12" />
                      Unverified
                    </ion-badge> -->
                      </div>
                    </div>
                  </ion-item>

                  <ion-item>
                    <div class="info-item">
                      <div class="info-icon">
                        <Calendar :size="20" />
                      </div>
                      <div class="info-content">
                        <ion-label>
                          <h3>Account Created</h3>
                          <p>{{ formatDate(authStore.user.created_at) }}</p>
                        </ion-label>
                      </div>
                    </div>
                  </ion-item>

                  <ion-item>
                    <div class="info-item">
                      <div class="info-icon">
                        <Activity :size="20" />
                      </div>
                      <div class="info-content">
                        <ion-label>
                          <h3>Last Active</h3>
                          <p>{{ formatDate(authStore.user.last_login) }}</p>
                        </ion-label>
                      </div>
                    </div>
                  </ion-item>
                </ion-list>
              </ion-card-content>
            </ion-card>

            <!-- Security Section -->
            <ion-card class="security-card">
              <ion-card-header>
                <ion-card-title>
                  <Shield :size="20" />
                  Security & Privacy
                </ion-card-title>
                <ion-card-subtitle>Manage your account security settings</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <ion-accordion-group>
                  <ion-accordion value="password">
                    <ion-item slot="header" color="light">
                      <div class="accordion-header">
                        <div class="accordion-icon">
                          <Lock :size="20" />
                        </div>
                        <div class="accordion-content">
                          <ion-label>
                            <h3>Change Password</h3>
                            <p>Update your account password</p>
                          </ion-label>
                        </div>
                      </div>
                    </ion-item>
                    <div class="ion-padding" slot="content">
                      <ChangePassword />
                    </div>
                  </ion-accordion>

                  <ion-accordion value="sessions">
                    <ion-item slot="header" color="light">
                      <div class="accordion-header">
                        <div class="accordion-icon">
                          <Smartphone :size="20" />
                        </div>
                        <div class="accordion-content">
                          <ion-label>
                            <h3>Active Sessions</h3>
                            <p>Manage your logged-in devices</p>
                          </ion-label>
                        </div>
                      </div>
                    </ion-item>
                    <div class="ion-padding" slot="content">
                      <ion-text color="medium">
                        <p>Session management feature coming soon...</p>
                      </ion-text>
                    </div>
                  </ion-accordion>
                </ion-accordion-group>
              </ion-card-content>
            </ion-card>

            <!-- Preferences Card -->
            <ion-card class="preferences-card">
              <ion-card-header>
                <ion-card-title>
                  <Palette :size="20" />
                  Preferences
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <ion-list lines="none">
                  <ion-item>
                    <div class="preference-item">
                      <div class="preference-info">
                        <Moon :size="20" />
                        <div>
                          <h3>Dark Mode</h3>
                          <p>Switch to dark theme</p>
                        </div>
                      </div>
                      <ion-toggle slot="end" :checked="isDarkMode" @ionChange="toggleDarkMode"></ion-toggle>
                    </div>
                  </ion-item>

                  <ion-item>
                    <div class="preference-item">
                      <div class="preference-info">
                        <Bell :size="20" />
                        <div>
                          <h3>Push Notifications</h3>
                          <p>Receive app notifications</p>
                        </div>
                      </div>
                      <ion-toggle slot="end" :checked="notificationsEnabled"
                        @ionChange="toggleNotifications"></ion-toggle>
                    </div>
                  </ion-item>
                </ion-list>
              </ion-card-content>
            </ion-card>

            <!-- Danger Zone -->
            <ion-card class="danger-card">
              <ion-card-header>
                <ion-card-title color="danger">
                  <AlertTriangle :size="20" />
                  Danger Zone
                </ion-card-title>
                <ion-card-subtitle>Irreversible actions</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <div class="danger-actions">
                  <ion-button fill="outline" color="danger" @click="confirmLogout" class="danger-btn">
                    <LogOut :size="18" />
                    Sign Out
                  </ion-button>
                  <ion-button fill="clear" color="danger" @click="confirmDeleteAccount" class="danger-btn">
                    <Trash2 :size="18" />
                    Delete Account
                  </ion-button>
                </div>
              </ion-card-content>
            </ion-card>
          </div>

          <!-- Error State -->
          <div v-else class="error-container">
            <div class="error-content">
              <AlertCircle :size="64" color="var(--ion-color-danger)" />
              <ion-text color="danger">
                <h2>Unable to Load Profile</h2>
                <p>There was an error loading your profile information.</p>
              </ion-text>
              <ion-button @click="refreshProfile" fill="outline" color="primary">
                <RotateCcw :size="16" />
                Try Again
              </ion-button>
            </div>
          </div>
        </ion-segment-content>
        <ion-segment-content id="history">
          <!-- User Header Card -->
            <ion-card class="history-header-card animate__animated animate__pulse">
              <ion-card-content color="light">
                
                <div class="user-header ion-padding-vertical">
                  <div class="avatar-container">
                    <div class="avatar">
                      <ion-text color="light">
                          <ScrollText :size="48" />
                      </ion-text>
                    </div>
                  </div>
                  
                  <ion-text color="light">
                    <h2 style="font-weight: bolder;">Shared Spots</h2>
                  </ion-text>
                </div>
              </ion-card-content>
            </ion-card>
        </ion-segment-content>
      </ion-segment-view>


      <!-- Refresh Indicator -->
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { alertController, toastController } from '@ionic/vue'
import UserStats from '@/components/UserStats.vue'
import ChangePassword from '@/components/ChangePassword.vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonBackButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonList,
  IonAccordionGroup,
  IonAccordion,
  IonSpinner,
  IonText,
  IonBadge,
  IonToggle,
  IonRefresher,
  IonRefresherContent,
  IonSegment, IonSegmentButton, IonSegmentContent, IonSegmentView
} from '@ionic/vue'
import {
  User,
  Mail,
  Calendar,
  Activity,
  Shield,
  Lock,
  Smartphone,
  Edit3,
  Bell,
  Trophy,
  Settings,
  Zap,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Palette,
  Moon,
  AlertTriangle,
  LogOut,
  Trash2,
  Crown,
  RotateCcw,
  ParkingSquare,
  GalleryHorizontal,
  GalleryHorizontalEnd,
  History,
  ScrollText
} from 'lucide-vue-next'
import { refreshOutline } from 'ionicons/icons'

const router = useRouter()
const authStore = useAuthStore()

// State
const isLoading = ref(true)
const isDarkMode = ref(false)
const notificationsEnabled = ref(true)
const profileSegment = ref('account')

onMounted(async () => {
  if (!authStore.user) {
    await loadProfile()
  } else {
    isLoading.value = false
  }

  // Load preferences from localStorage
  isDarkMode.value = localStorage.getItem('darkMode') === 'true'
  notificationsEnabled.value = localStorage.getItem('notifications') !== 'false'
})

const loadProfile = async () => {
  isLoading.value = true
  try {
    await authStore.fetchProfile()
  } catch (error) {
    console.error('Failed to load profile:', error)
    showToast('Failed to load profile', 'danger')
  } finally {
    isLoading.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch (error) {
    return 'Invalid date'
  }
}

const refreshProfile = async () => {
  try {
    await authStore.fetchProfile()
    showToast('Profile refreshed', 'success')
  } catch (error) {
    console.error('Failed to refresh profile:', error)
    showToast('Failed to refresh profile', 'danger')
  }
}

const handleRefresh = async (event) => {
  await refreshProfile()
  event.target.complete()
}

const showToast = async (message, color = 'primary') => {
  const toast = await toastController.create({
    message,
    duration: 2000,
    color,
    position: 'top'
  })
  await toast.present()
}

// Quick Actions
const editProfile = () => {
  showToast('Edit profile feature coming soon!', 'primary')
}

const viewAchievements = () => {
  showToast('Achievements feature coming soon!', 'primary')
}

const viewSettings = () => {
  showToast('Settings feature coming soon!', 'primary')
}

const editUsername = () => {
  showToast('Username editing coming soon!', 'primary')
}

// Preferences
const toggleDarkMode = (event) => {
  isDarkMode.value = event.detail.checked
  localStorage.setItem('darkMode', isDarkMode.value.toString())
  document.body.classList.toggle('dark', isDarkMode.value)
  showToast(`Dark mode ${isDarkMode.value ? 'enabled' : 'disabled'}`, 'success')
}

const toggleNotifications = (event) => {
  notificationsEnabled.value = event.detail.checked
  localStorage.setItem('notifications', notificationsEnabled.value.toString())
  showToast(`Notifications ${notificationsEnabled.value ? 'enabled' : 'disabled'}`, 'success')
}

// Danger Zone Actions
const confirmLogout = async () => {
  const alert = await alertController.create({
    header: 'Sign Out',
    message: 'Are you sure you want to sign out of your account?',
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Sign Out',
        role: 'confirm',
        handler: () => {
          logout()
        }
      }
    ]
  })

  await alert.present()
}

const confirmDeleteAccount = async () => {
  const alert = await alertController.create({
    header: 'Delete Account',
    message: 'This action is irreversible. All your data will be permanently deleted. Are you sure?',
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => {
          showToast('Account deletion feature coming soon!', 'warning')
        }
      }
    ]
  })

  await alert.present()
}

const logout = () => {
  authStore.logout()
  router.push('/auth/login')
  showToast('Successfully signed out', 'success')
}
</script>

<style scoped>
.loading-container,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.loading-content,
.error-content {
  text-align: center;
  padding: 2rem;
}

.loading-content ion-spinner {
  margin-bottom: 1rem;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* User Header Card */
.user-header-card {
  background: linear-gradient(135deg, var(--ion-color-tertiary) 50%, var(--ion-color-primary) 100%);
  color: white;
}

.user-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-container {
  position: relative;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.premium-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-info h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.user-info p {
  margin: 0 0 0.25rem 0;
}

.member-since {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

/* Quick Actions */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
}

.quick-action-btn {
  height: auto;
  padding: 1rem 0.5rem;
}

.quick-action-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.quick-action-content span {
  font-size: 0.75rem;
  font-weight: 500;
}

/* Info Items */
.info-item,
.preference-item {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 1rem;
}

.info-icon,
.accordion-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--ion-color-primary-tint);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ion-color-light);
}

.info-content {
  flex: 1;
}

.info-content h3 {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
}

.info-content p {
  margin: 0;
  color: var(--ion-color-medium);
}

.email-status {
  margin-left: auto;
}

/* Accordion */
.accordion-header {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 1rem;
}

.accordion-content {
  flex: 1;
}

.accordion-indicator {
  margin-left: auto;
  color: var(--ion-color-medium);
}

/* Preferences */
.preference-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.preference-info div h3 {
  margin: 0 0 0.25rem 0;
  font-weight: 600;
}

.preference-info div p {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 0.875rem;
}

/* Cards */
.account-info-card ion-card-title,
.security-card ion-card-title,
.preferences-card ion-card-title,
.quick-actions-card ion-card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
}

.danger-card ion-card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
}

.danger-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.danger-btn {
  justify-content: flex-start;
  text-align: left;
}

/* Responsive Design */
@media (max-width: 576px) {
  .user-header {
    flex-direction: column;
    text-align: center;
  }

  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .info-item {
    flex-wrap: wrap;
  }

  .danger-actions {
    gap: 0.5rem;
  }
}
</style>
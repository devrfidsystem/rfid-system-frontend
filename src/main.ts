import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './app/router';
import { useAuthStore } from '@/stores/auth';
import './styles/app.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const authStore = useAuthStore(pinia);

const bootstrapAuth = async () => {
  try {
    await authStore.initializeAuth();
  } catch (error) {
    console.error('Failed to bootstrap auth session', error);
    authStore.clearProfile();
  }
};

void bootstrapAuth();

app.mount('#app');

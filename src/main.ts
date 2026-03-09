import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './app/router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import './styles/app.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const authStore = useAuthStore(pinia);

const bootstrapAuth = async () => {
  try {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    await authStore.initializeFromSession(session ?? null);
  } catch (error) {
    console.error('Failed to bootstrap auth session', error);
    authStore.clearProfile();
  }
};

void bootstrapAuth();

app.mount('#app');

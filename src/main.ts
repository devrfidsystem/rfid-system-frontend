import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "@/store/auth.store";
import "./assets/styles/app.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const authStore = useAuthStore(pinia);

const bootstrapAuth = async () => {
    try {
        // Initialize auth store (supabase client will lazily initialize when needed)
        await authStore.initializeAuth();
    } catch {
        authStore.clearProfile();
    }
};

void bootstrapAuth();

app.mount("#app");

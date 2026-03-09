import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAccess } from '@/composables/useAccess';
import { useAuthStore } from '@/stores/auth';

const createPageRoute = (path: string, title: string, description: string): RouteRecordRaw => ({
  path,
  component: () => import('@/modules/shared/PageShell.vue'),
  props: {
    title,
    description
  }
});

type MasterRoute = {
  path: string;
  entity: string;
  title: string;
  description: string;
};

type ReportRoute = {
  path: string;
  report: string;
};

const authRoutes: RouteRecordRaw[] = [
  {
    path: '/auth/login',
    component: () => import('@/modules/auth/LoginPage.vue')
  },
  {
    path: '/auth/register',
    component: () => import('@/modules/auth/RegisterPage.vue')
  },
  {
    path: '/auth',
    redirect: '/auth/login'
  }
];

const masterRoutes: MasterRoute[] = [
  { path: 'attribute', entity: 'attributes', title: 'Attribute Management', description: 'Define attribute templates for SKUs.' },
  { path: 'category', entity: 'categories', title: 'Category Catalog', description: 'Organize goods into categories.' },
  { path: 'customer', entity: 'customers', title: 'Customer Master', description: 'Maintain customer profiles and contracts.' },
  { path: 'warehouse', entity: 'warehouses', title: 'Warehouse Master', description: 'Manage warehouse definitions and zones.' },
  { path: 'location', entity: 'locations', title: 'Location Master', description: 'Track physical storage locations.' },
  { path: 'uom', entity: 'uoms', title: 'Unit of Measure', description: 'Control units of measurement.' },
  { path: 'supplier', entity: 'suppliers', title: 'Supplier Master', description: 'List approved suppliers.' },
  { path: 'product', entity: 'products', title: 'Product Master', description: 'Catalog all RFID-enabled products.' }
];

const reportRoutes: ReportRoute[] = [
  { path: 'inbound', report: 'inbound' },
  { path: 'outbound', report: 'outbound' },
  { path: 'stock-opname', report: 'stock-opname' },
  { path: 'relocation', report: 'relocation' },
  { path: 'transfer', report: 'transfer' },
  { path: 'return', report: 'return' },
  { path: 'current-stock', report: 'current-stock' },
  { path: 'stock-period', report: 'stock-period' }
];

const routes: RouteRecordRaw[] = [
  ...authRoutes,
  {
    path: '/',
    component: () => import('@/app/layout/AppLayout.vue'),
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        component: () => import('@/modules/dashboard/DashboardPage.vue')
      },
      {
        path: 'log',
        component: () => import('@/modules/log/LogLayout.vue'),
        children: [
          {
            path: 'tag-registration',
            component: () => import('@/modules/log/TagRegistrationPage.vue')
          },
          {
            path: 'tracking',
            component: () => import('@/modules/log/TrackingPage.vue')
          }
        ]
      },
      {
        path: 'master',
        component: () => import('@/modules/master/MasterLayout.vue'),
        children: masterRoutes.map((route) => ({
          path: route.path,
          component: () => import('@/modules/master/MasterEntityPage.vue'),
          meta: {
            entity: route.entity,
            title: route.title,
            description: route.description
          }
        }))
      },
      {
        path: 'report',
        component: () => import('@/modules/report/ReportLayout.vue'),
        children: reportRoutes.map((route) => ({
          path: route.path,
          component: () => import('@/modules/report/ReportEntityPage.vue'),
          meta: {
            report: route.report
          }
        }))
      },
      {
        path: 'settings',
        component: () => import('@/modules/settings/SettingsLayout.vue'),
        children: [
          createPageRoute('menus', 'Menus', 'Control navigation structures.'),
          createPageRoute('roles', 'Roles', 'Define access levels.'),
          createPageRoute('users', 'Users', 'Manage system users.'),
          createPageRoute('user-companies', 'User Companies', 'Link users to companies.'),
          createPageRoute('user-apps', 'User Apps', 'Assign applications to users.')
        ]
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
  }
  const authStore = useAuthStore();
  const { hasPathAccess, firstAccessiblePath } = useAccess();
  const requiresAuth = to.matched.some((record) => Boolean(record.meta?.requiresAuth));
  const isAuthRoute = to.path.startsWith('/auth');

  if (requiresAuth && authStore.initialized && !authStore.isAuthenticated) {
    return {
      path: '/auth/login',
      query: { redirect: to.fullPath }
    };
  }

  if (requiresAuth && authStore.initialized && authStore.isAuthenticated && !hasPathAccess(to.path)) {
    return { path: firstAccessiblePath.value };
  }

  if (isAuthRoute && authStore.initialized && authStore.isAuthenticated) {
    return { path: '/dashboard' };
  }

  return true;
});

export default router;

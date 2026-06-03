import {
    createRouter,
    createWebHistory,
    type RouteRecordRaw,
} from "vue-router";
import { useAccess } from "@/composable/useAccess";
import { useAuthStore } from "@/store/auth.store";
import { masterEntities } from "@/views/master/entityConfig";
import { reportConfigs, type ReportKey } from "@/views/report/reportConfig";
import type { EntityKey } from "@/model/entities";
import { reportPaths } from "@/api/feature/dto/report.dto";
import type { TransactionKey } from "@/services/transactions.service";

const createPageRoute = (
    path: string,
    title: string,
    description: string,
): RouteRecordRaw => ({
    path,
    component: () => import("@/views/shared/PageShell.vue"),
    props: {
        title,
        description,
    },
});

const masterEntityRouteAliases: Partial<Record<EntityKey, string[]>> = {
    attributes: ["attribute"],
    customers: ["customer"],
    suppliers: ["supplier"],
    warehouses: ["warehouse"],
    locations: ["location"],
    uoms: ["uom"],
    "product-categories": ["product-category"],
    products: ["product"],
};

const createMasterRoutes = (): RouteRecordRaw[] =>
    Object.entries(masterEntities).map(([entity, config]) => {
        const route: RouteRecordRaw = {
            path: entity,
            component: () => import("@/views/master/MasterEntityPage.vue"),
            meta: {
                entity,
                title: config.title,
                description: config.description,
            },
        };
        const aliases = masterEntityRouteAliases[entity as EntityKey];
        if (aliases && aliases.length) {
            route.alias = aliases;
        }
        return route;
    });

const dashboardSections = [
    "overview",
    "low-stock",
    "recent-activity",
    "epc-status",
] as const;
const dashboardRoutes = dashboardSections.map((section) => ({
    path: `dashboard/${section}`,
    component: () => import("@/views/dashboard/DashboardPage.vue"),
    meta: {
        section,
    },
}));

const transactionKeys = [
    "inbound",
    "outbound",
    "relocation",
    "transfer",
    "return",
    "opname",
] as const;
const transactionPattern = transactionKeys.join("|");

const resolveReportSegment = (key: ReportKey) => {
    const raw = reportPaths[key] ?? key;
    const trimmed = raw.replace(/^\/+/, "");
    if (trimmed.startsWith("reports/")) {
        return trimmed.replace(/^reports\//, "");
    }
    return trimmed || key;
};

const reportChildRoutes: RouteRecordRaw[] = (
    Object.keys(reportConfigs) as ReportKey[]
).map((key) => ({
    path: resolveReportSegment(key),
    component: () => import("@/views/report/ReportEntityPage.vue"),
    meta: {
        report: key,
        tagline: "Reports",
    },
}));

const authRoutes: RouteRecordRaw[] = [
    {
        path: "/login",
        component: () => import("@/views/auth/LoginPage.vue"),
    },
    {
        path: "/register",
        component: () => import("@/views/auth/RegisterPage.vue"),
    },
    {
        path: "/auth/login",
        redirect: "/login",
    },
    {
        path: "/auth/register",
        redirect: "/register",
    },
    {
        path: "/auth",
        redirect: "/login",
    },
];

const routes: RouteRecordRaw[] = [
    ...authRoutes,
    {
        path: "/",
        component: () => import("@/components/templates/AppLayout.vue"),
        meta: {
            requiresAuth: true,
        },
        children: [
            {
                path: "",
                redirect: "/dashboard/overview",
            },
            {
                path: "dashboard",
                redirect: "/dashboard/overview",
            },
            ...dashboardRoutes,
            {
                path: "iam",
                component: () => import("@/components/templates/IamLayout.vue"),
                redirect: "/iam/roles",
                children: [
                    {
                        path: "roles",
                        component: () => import("@/views/iam/RolesPage.vue"),
                    },
                    {
                        path: "users",
                        component: () =>
                            import("@/views/iam/UserAccessPage.vue"),
                    },
                ],
            },
            {
                path: "users",
                component: () => import("@/views/users/UsersPage.vue"),
            },
            {
                path: "master-data",
                component: () =>
                    import("@/components/templates/MasterLayout.vue"),
                children: [
                    {
                        path: "",
                        redirect: "/master-data/warehouses",
                    },
                    ...createMasterRoutes(),
                ],
            },
            {
                path: "master",
                redirect: "/master-data/warehouses",
            },
            {
                path: "rfid",
                redirect: "/rfid/tags",
            },
            {
                path: "rfid/tags",
                component: () =>
                    import("@/views/tag-registration/pages/TagRegistrationPage.vue"),
            },
            {
                path: "rfid/assignments",
                component: () => import("@/views/rfid/RfidAssignmentPage.vue"),
            },
            {
                path: "rfid/events",
                component: () => import("@/views/rfid/RfidEventPage.vue"),
            },
            {
                path: "stock",
                redirect: "/stock/balance",
            },
            {
                path: "stock/balance",
                component: () => import("@/views/stock/StockBalancePage.vue"),
            },
            {
                path: "stock/ledger",
                component: () => import("@/views/stock/StockLedgerPage.vue"),
            },
            {
                path: "transactions",
                redirect: "/transactions/inbound",
            },
            {
                path: `transactions/:transactionKey(${transactionPattern})`,
                component: () =>
                    import("@/views/transactions/TransactionListPage.vue"),
                props: (route) => ({
                    transactionKey: route.params
                        .transactionKey as TransactionKey,
                }),
            },
            {
                path: `transactions/:transactionKey(${transactionPattern})/new`,
                component: () =>
                    import("@/views/transactions/TransactionCreatePage.vue"),
                props: (route) => ({
                    transactionKey: route.params
                        .transactionKey as TransactionKey,
                }),
            },
            {
                path: `transactions/:transactionKey(${transactionPattern})/:id`,
                component: () =>
                    import("@/views/transactions/TransactionDetailPage.vue"),
                props: (route) => ({
                    transactionKey: route.params
                        .transactionKey as TransactionKey,
                    id: route.params.id,
                }),
            },
            {
                path: "reports",
                component: () =>
                    import("@/components/templates/ReportLayout.vue"),
                children: [
                    {
                        path: "",
                        redirect:
                            reportChildRoutes[0]?.path ?? "stock-movement",
                    },
                    ...reportChildRoutes,
                ],
            },
            {
                path: "settings",
                component: () =>
                    import("@/components/templates/SettingsLayout.vue"),
                redirect: "/settings/companies",
                children: [
                    {
                        path: "companies",
                        component: () =>
                            import("@/views/settings/CompaniesPage.vue"),
                    },
                    {
                        path: "apps",
                        component: () =>
                            import("@/views/settings/AppsPage.vue"),
                    },
                    {
                        path: "menus",
                        component: () =>
                            import("@/views/settings/MenusPage.vue"),
                    },
                ],
            },
            {
                path: "profile",
                component: () => import("@/views/profile/ProfilePage.vue"),
            },
            {
                path: "report",
                redirect: "/reports",
            },
            {
                path: "log/tracking",
                component: () => import("@/views/log/TrackingPage.vue"),
            },
            {
                path: "menus",
                redirect: "/iam/menus",
            },
            {
                path: "roles",
                redirect: "/iam/roles",
            },
            {
                path: "user-companies",
                redirect: "/iam/user-companies",
            },
            {
                path: "user-apps",
                redirect: "/iam/roles",
            },
            {
                path: "user-warehouses",
                redirect: "/iam/user-warehouses",
            },
        ],
    },
    {
        path: "/:pathMatch(.*)*",
        redirect: "/dashboard/overview",
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to) => {
    if (typeof document !== "undefined") {
        document.body.style.overflow = "";
    }
    const authStore = useAuthStore();
    const { hasPathAccess, firstAccessiblePath } = useAccess();
    try {
        await authStore.initializeAuth();
    } catch {
        authStore.clearProfile();
    }
    const requiresAuth = to.matched.some((record) =>
        Boolean(record.meta?.requiresAuth),
    );
    const isAuthRoute =
        to.path.startsWith("/auth") ||
        to.path === "/login" ||
        to.path === "/register";
    const isAuthenticated = authStore.isAuthenticated;

    if (requiresAuth && !isAuthenticated) {
        return {
            path: "/login",
            query: { redirect: to.fullPath },
        };
    }

    if (requiresAuth && isAuthenticated && !hasPathAccess(to.path)) {
        const fallback = firstAccessiblePath.value ?? "/dashboard/overview";
        if (fallback === to.path) {
            return true;
        }
        return { path: fallback };
    }

    if (isAuthRoute && isAuthenticated) {
        return { path: "/dashboard/overview" };
    }

    return true;
});

export default router;

<template>
    <section class="space-y-6">
        <PageHeader
            tagline="Demo"
            title="Todo List"
            description="A lightweight task board with local persistence, filters, and completion tracking."
        />

        <div
            class="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]"
        >
            <Card class="space-y-5">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <Input
                        v-model="draftTitle"
                        class="flex-1"
                        label="Task"
                        placeholder="Write a task and press Enter"
                        :error="draftError"
                        :hide-message="!draftError"
                        @keyup.enter="addTodo"
                    />
                    <Button
                        object-id="btn_AddTodo"
                        class="sm:min-w-[120px]"
                        :disabled="!draftTitle.trim()"
                        @click="addTodo"
                    >
                        Add task
                    </Button>
                </div>

                <Input
                    v-model="searchQuery"
                    label="Search"
                    placeholder="Search tasks by title"
                    :hide-message="true"
                />

                <div class="flex flex-wrap gap-2">
                    <Button
                        v-for="option in filterOptions"
                        :key="option.value"
                        size="sm"
                        :variant="
                            currentFilter === option.value
                                ? 'primary'
                                : 'neutral'
                        "
                        @click="currentFilter = option.value"
                    >
                        {{ option.label }}
                        <span class="text-[11px] opacity-80">
                            {{ filterCounts[option.value] }}
                        </span>
                    </Button>
                </div>

                <div class="flex flex-wrap gap-3">
                    <Badge tone="info">{{ totalTodos }} total</Badge>
                    <Badge tone="neutral">{{ visibleTodos.length }} shown</Badge>
                    <Badge tone="success">{{ completedTodos }} done</Badge>
                    <Badge tone="warning">{{ activeTodos }} open</Badge>
                </div>

                <div v-if="visibleTodos.length" class="space-y-3">
                    <article
                        v-for="todo in visibleTodos"
                        :key="todo.id"
                        class="group flex items-start gap-3 rounded-md border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
                    >
                        <button
                            type="button"
                            class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors"
                            :class="
                                todo.completed
                                    ? 'border-primary-600 bg-primary-600 text-white'
                                    : 'border-gray-300 bg-white text-transparent hover:border-primary-400'
                            "
                            :aria-label="
                                todo.completed
                                    ? 'Mark task as open'
                                    : 'Mark task as complete'
                            "
                            @click="toggleTodo(todo.id)"
                        >
                            <Check class="h-4 w-4" />
                        </button>

                        <div class="min-w-0 flex-1">
                            <div class="flex flex-wrap items-center gap-2">
                                <h3
                                    class="text-sm font-semibold text-gray-900"
                                    :class="
                                        todo.completed
                                            ? 'line-through text-gray-400'
                                            : ''
                                    "
                                >
                                    {{ todo.title }}
                                </h3>
                                <Badge
                                    :tone="todo.completed ? 'success' : 'neutral'"
                                >
                                    {{ todo.completed ? 'Completed' : 'Open' }}
                                </Badge>
                            </div>
                            <p class="mt-1 text-xs text-gray-500">
                                Added {{ formatRelativeDate(todo.createdAt) }}
                            </p>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            class="shrink-0"
                            :aria-label="`Delete ${todo.title}`"
                            @click="removeTodo(todo.id)"
                        >
                            <Trash2 class="h-4 w-4" />
                        </Button>
                    </article>
                </div>

                <EmptyState
                    v-else
                    title="No tasks here"
                    :description="
                        searchQuery || currentFilter !== 'all'
                            ? 'No tasks match the selected filter or search.'
                            : 'Add your first task to start tracking work.'
                    "
                    variant="default"
                />
            </Card>

            <div class="space-y-6">
                <Card>
                    <div class="space-y-4">
                        <div>
                            <p class="text-sm font-semibold text-gray-900">
                                Progress
                            </p>
                            <p class="mt-1 text-sm text-gray-500">
                                Completion is stored locally in your browser.
                            </p>
                        </div>

                        <div class="space-y-2">
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-gray-600">Completed</span>
                                <span class="font-semibold text-gray-900">
                                    {{ completionRate }}%
                                </span>
                            </div>
                            <div class="h-3 overflow-hidden rounded-full bg-gray-100">
                                <div
                                    class="h-full rounded-full bg-primary-600 transition-all duration-300"
                                    :style="{ width: `${completionRate}%` }"
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div class="space-y-4">
                        <div>
                            <p class="text-sm font-semibold text-gray-900">
                                Quick actions
                            </p>
                            <p class="mt-1 text-sm text-gray-500">
                                Manage finished work without leaving the page.
                            </p>
                        </div>

                        <div class="flex flex-col gap-3">
                            <Button
                                variant="outline"
                                :disabled="completedTodos === 0"
                                @click="clearCompleted"
                            >
                                Clear completed
                            </Button>
                            <Button
                                variant="ghost"
                                :disabled="todos.length === 0"
                                @click="resetDemo"
                            >
                                Reset demo data
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { Check, Trash2 } from "lucide-vue-next";
import PageHeader from "@/components/molecules/PageHeader.vue";
import Card from "@/components/molecules/Card.vue";
import EmptyState from "@/components/molecules/EmptyState.vue";
import Button from "@/components/atoms/Button.vue";
import Input from "@/components/atoms/Input.vue";
import Badge from "@/components/atoms/Badge.vue";
import {
    filterTodos,
    type TodoFilter,
    type TodoItem,
} from "./todo.helpers";

const STORAGE_KEY = "warehouse.todo-list";

const seedTodos: TodoItem[] = [
    {
        id: "seed-1",
        title: "Review warehouse intake backlog",
        completed: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
        id: "seed-2",
        title: "Archive completed picking tasks",
        completed: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    },
];

const todos = ref<TodoItem[]>([]);
const draftTitle = ref("");
const draftError = ref("");
const currentFilter = ref<TodoFilter>("all");
const searchQuery = ref("");

const filterOptions: Array<{ label: string; value: TodoFilter }> = [
    { label: "All", value: "all" },
    { label: "Active", value: "active" },
    { label: "Completed", value: "completed" },
];

const loadTodos = () => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        todos.value = [...seedTodos];
        return;
    }

    try {
        const parsed = JSON.parse(raw) as TodoItem[];
        todos.value = Array.isArray(parsed) ? parsed : [...seedTodos];
    } catch {
        todos.value = [...seedTodos];
    }
};

onMounted(() => {
    loadTodos();
});

watch(draftTitle, () => {
    if (draftError.value) {
        draftError.value = "";
    }
});

watch(
    todos,
    (value) => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    },
    { deep: true },
);

const addTodo = () => {
    const title = draftTitle.value.trim();
    if (!title) {
        draftError.value = "Task title is required.";
        return;
    }

    todos.value = [
        {
            id:
                window.crypto?.randomUUID?.() ??
                `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            title,
            completed: false,
            createdAt: new Date().toISOString(),
        },
        ...todos.value,
    ];
    draftTitle.value = "";
    draftError.value = "";
};

const toggleTodo = (id: string) => {
    todos.value = todos.value.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
    );
};

const removeTodo = (id: string) => {
    todos.value = todos.value.filter((todo) => todo.id !== id);
};

const clearCompleted = () => {
    todos.value = todos.value.filter((todo) => !todo.completed);
};

const resetDemo = () => {
    todos.value = [...seedTodos];
    currentFilter.value = "all";
    searchQuery.value = "";
};

const visibleTodos = computed(() => {
    return filterTodos(todos.value, currentFilter.value, searchQuery.value);
});

const totalTodos = computed(() => todos.value.length);
const completedTodos = computed(
    () => todos.value.filter((todo) => todo.completed).length,
);
const activeTodos = computed(() => totalTodos.value - completedTodos.value);
const completionRate = computed(() =>
    totalTodos.value === 0
        ? 0
        : Math.round((completedTodos.value / totalTodos.value) * 100),
);

const filterCounts = computed<Record<TodoFilter, number>>(() => ({
    all: totalTodos.value,
    active: activeTodos.value,
    completed: completedTodos.value,
}));

const formatRelativeDate = (value: string) => {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

    if (diffHours < 24) {
        return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    }

    const diffDays = Math.max(1, Math.round(diffHours / 24));
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
};
</script>

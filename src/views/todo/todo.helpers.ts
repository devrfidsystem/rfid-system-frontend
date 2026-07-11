export type TodoFilter = "all" | "active" | "completed";

export type TodoItem = {
    id: string;
    title: string;
    completed: boolean;
    createdAt: string;
};

const normalizeQuery = (query: string) => query.trim().toLowerCase();

const matchesFilter = (todo: TodoItem, filter: TodoFilter) => {
    if (filter === "active") {
        return !todo.completed;
    }

    if (filter === "completed") {
        return todo.completed;
    }

    return true;
};

const matchesQuery = (todo: TodoItem, query: string) => {
    const normalizedQuery = normalizeQuery(query);
    if (!normalizedQuery) {
        return true;
    }

    return todo.title.toLowerCase().includes(normalizedQuery);
};

export const filterTodos = (
    todos: TodoItem[],
    filter: TodoFilter,
    query = "",
) =>
    todos.filter(
        (todo) => matchesFilter(todo, filter) && matchesQuery(todo, query),
    );

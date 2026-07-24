import { describe, expect, it } from "vitest";
import { filterTodos, type TodoItem } from "./todo.helpers";

describe("filterTodos", () => {
    it("matches the title regardless of case and surrounding whitespace", () => {
        const todos: TodoItem[] = [
            {
                id: "1",
                title: "Review inbound tasks",
                completed: false,
                createdAt: "2026-07-01T00:00:00.000Z",
            },
            {
                id: "2",
                title: "Archive picking batch",
                completed: true,
                createdAt: "2026-07-01T01:00:00.000Z",
            },
        ];

        expect(filterTodos(todos, "active", "  review  ")).toEqual([todos[0]]);
    });
});

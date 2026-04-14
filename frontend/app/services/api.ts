import { Task } from "@/types/task";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined");
}

export type TaskPayload = Omit<Task, "id" | "createdAt">;


export const getTasks = async (): Promise<Task[]> => {
    const response = await fetch(API_URL + "/Tasks");
    return response.json();
};

export const createTask = async (task: TaskPayload): Promise<Task> => {
    const { id, ...safeTask } = task as any;

    const response = await fetch(API_URL + "/Tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(safeTask),
    });

    return response.json();
};

export const updateTask = async (id: number, task: Task): Promise<Task> => {
    const response = await fetch(`${API_URL}/Tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
    });
    return response.json();
};

export const deleteTask = async (id: number): Promise<void> => {
    await fetch(`${API_URL}/Tasks/${id}`, { method: "DELETE" });
};
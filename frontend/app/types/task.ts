export type Task = {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  createdAt: string;
  completedAt?: string | null;
};

 
import { create } from 'zustand';
import { taskService, Task } from '../services/task.service';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  loadTasks: (filters?: { status?: string; type?: string }) => Promise<void>;
  createTask: (data: {
    title: string;
    description?: string;
    type: string;
    input?: any;
    priority?: number;
  }) => Promise<Task>;
  cancelTask: (id: string) => Promise<void>;
  retryTask: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: string, data?: any) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  isLoading: false,
  error: null,

  loadTasks: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await taskService.getTasks(filters);
      set({ tasks, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to load tasks',
        isLoading: false,
      });
    }
  },

  createTask: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const task = await taskService.createTask(data);
      set((state) => ({
        tasks: [task, ...state.tasks],
        isLoading: false,
      }));
      return task;
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to create task',
        isLoading: false,
      });
      throw error;
    }
  },

  cancelTask: async (id) => {
    try {
      await taskService.cancelTask(id);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, status: 'cancelled' as const } : t
        ),
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to cancel task' });
      throw error;
    }
  },

  retryTask: async (id) => {
    try {
      await taskService.retryTask(id);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, status: 'pending' as const } : t
        ),
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Failed to retry task' });
      throw error;
    }
  },

  updateTaskStatus: (id, status, data) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: status as any,
              output: data?.result || t.output,
              error_message: data?.error || t.error_message,
            }
          : t
      ),
    }));
  },
}));

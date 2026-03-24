export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type TaskType = 'planning' | 'research' | 'execution' | 'review' | 'analysis';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: number;
  input: Record<string, any>;
  output: Record<string, any>;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  dependencies: number[];
  startedAt?: Date;
  completedAt?: Date;
}

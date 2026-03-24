import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { redis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export interface QueueConfig {
  name: string;
  defaultJobOptions?: {
    attempts?: number;
    backoff?: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    removeOnComplete?: boolean | number;
    removeOnFail?: boolean | number;
  };
}

export class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();

  constructor() {
    this.setupQueues();
  }

  private setupQueues() {
    // Task Queue
    this.createQueue({
      name: 'taskQueue',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    });

    // Agent Queue
    this.createQueue({
      name: 'agentQueue',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    });

    // Workflow Queue
    this.createQueue({
      name: 'workflowQueue',
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: 50,
        removeOnFail: 500,
      },
    });

    // Automation Queue
    this.createQueue({
      name: 'automationQueue',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    });

    logger.info('[QueueManager] All queues initialized');
  }

  private createQueue(config: QueueConfig) {
    const queue = new Queue(config.name, {
      connection: { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT) || 6379, password: process.env.REDIS_PASSWORD },
      defaultJobOptions: config.defaultJobOptions,
    });

    this.queues.set(config.name, queue);

    // Setup queue events
    const queueEvents = new QueueEvents(config.name, {
      connection: { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT) || 6379, password: process.env.REDIS_PASSWORD },
    });

    queueEvents.on('completed', ({ jobId }) => {
      logger.info(`[${config.name}] Job ${jobId} completed`);
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error(`[${config.name}] Job ${jobId} failed: ${failedReason}`);
    });

    queueEvents.on('progress', ({ jobId, data }) => {
      logger.debug(`[${config.name}] Job ${jobId} progress: ${JSON.stringify(data)}`);
    });

    this.queueEvents.set(config.name, queueEvents);
  }

  getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  registerWorker(
    queueName: string,
    processor: (job: Job) => Promise<any>,
    concurrency: number = 5
  ) {
    const worker = new Worker(queueName, processor, {
      connection: { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT) || 6379, password: process.env.REDIS_PASSWORD },
      concurrency,
    });

    worker.on('completed', (job) => {
      logger.info(`[${queueName}] Worker completed job ${job.id}`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`[${queueName}] Worker failed job ${job?.id}: ${err.message}`);
    });

    this.workers.set(queueName, worker);
    logger.info(`[QueueManager] Worker registered for ${queueName} with concurrency ${concurrency}`);
  }

  async addJob(
    queueName: string,
    jobName: string,
    data: any,
    options?: {
      priority?: number;
      delay?: number;
      repeat?: {
        pattern: string; // cron pattern
      };
    }
  ) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.add(jobName, data, options);
    logger.info(`[${queueName}] Job ${job.id} added: ${jobName}`);
    return job;
  }

  async getJob(queueName: string, jobId: string) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.getJob(jobId);
  }

  async getJobCounts(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.getJobCounts();
  }

  async pauseQueue(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
    logger.info(`[${queueName}] Queue paused`);
  }

  async resumeQueue(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    logger.info(`[${queueName}] Queue resumed`);
  }

  async closeAll() {
    logger.info('[QueueManager] Closing all queues and workers');

    for (const [name, worker] of this.workers) {
      await worker.close();
      logger.info(`[${name}] Worker closed`);
    }

    for (const [name, queue] of this.queues) {
      await queue.close();
      logger.info(`[${name}] Queue closed`);
    }

    for (const [name, events] of this.queueEvents) {
      await events.close();
      logger.info(`[${name}] Queue events closed`);
    }
  }
}

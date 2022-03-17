/**
 * 工作执行结果
 */
export type ITaskResult = void | {
  data?: { [key: string]: any };
  scope?: any;
};
/**
 * 工作接口
 */
export interface ITask {
  run: (previousTaskResult: ITaskResult) => Promise<ITaskResult>;
}
/**
 * 任务接口
 */
export interface IJob {
  id: string;
  add: (task: ITask) => void;
  run: (previousTaskResult: ITaskResult) => Promise<ITaskResult>;
}

/**
 * 任务调度器
 */
export interface IJobScheduler {
  add(item: IJob | IJobScheduler): void;
  pause(key?: string): string;
  resume(key: string): boolean;
  clear();
}

export class BaseJob implements IJob {
  id: string;
  private _freeze = false;
  private _queue: ITask[] = [];
  constructor(options: { id?: string; tasks?: ITask[] } = {}) {
    this.id = options.id || performance.now() + "";
    if (options.tasks) {
      for (const task of options.tasks) {
        this.add(task);
      }
    }
  }
  add(task: ITask): void {
    if (!this._freeze) {
      this._queue.push(task);
    } else {
      console.warn("任务已冻结,不可再添加");
    }
  }
  async run(previousTaskResult: ITaskResult): Promise<ITaskResult> {
    this._freeze = true;
    for (const task of this._queue) {
      previousTaskResult = await task.run(previousTaskResult);
    }
    return previousTaskResult;
  }
}

export class JobScheduler implements IJobScheduler {
  private _schedulerStore: Map<string, JobScheduler> = new Map<
    string,
    JobScheduler
  >();
  private _jobQueue: IJob[] = [];
  private _paused = false;
  private _pauseKeyStore = new Set<string>();
  private _job: IJob;

  public get job(): IJob {
    return this._job;
  }

  private _run(previousTaskResult: ITaskResult) {
    this._job = this._jobQueue[0];
    if (this._job && !this._paused) {
      this._job.run(previousTaskResult).then((taskResult) => {
        this._jobQueue = this._jobQueue.slice(1);
        this._job = void 0;
        this._run(taskResult);
      });
    }
  }
  add(job: BaseJob, schedulerId?: string): void {
    if (schedulerId !== void 0 && schedulerId !== null) {
      this._schedulerStore.has(schedulerId) ||
        this._schedulerStore.set(schedulerId, new JobScheduler());
      this._schedulerStore.get(schedulerId).add(job);
    } else {
      this._jobQueue.push(job);
      this._jobQueue.length === 1 && this._run();
    }
  }
  remove(jobId: string, schedulerId?: string) {
    if (schedulerId !== void 0 && schedulerId !== null) {
      this._schedulerStore.get(schedulerId)?.remove(jobId);
    } else if (jobId !== this._job?.id) {
      this._jobQueue = this._jobQueue.filter((i) => i.id !== jobId);
    }
  }
  pause(key?: string, schedulerId?: string): string {
    if (schedulerId !== void 0 && schedulerId !== null) {
      return this._schedulerStore.get(schedulerId)?.pause(key);
    }
    key || (key = performance.now() + "");
    this._pauseKeyStore.add(key);
    this._paused = true;
    return key;
  }
  resume(key?: string, schedulerId?: string): boolean {
    if (schedulerId !== void 0 && schedulerId !== null) {
      return this._schedulerStore.get(schedulerId)?.resume(key);
    }
    if (key) {
      this._pauseKeyStore.delete(key);
      if (this._pauseKeyStore.size > 0) {
        return false;
      }
    } else {
      this._pauseKeyStore.clear();
    }
    this._paused = false;
    this._run();
    return true;
  }
  clear(schedulerId?: string) {
    if (schedulerId !== void 0 && schedulerId !== null) {
      this._schedulerStore.get(schedulerId)?.clear();
    } else {
      this._jobQueue = [];
      this._pauseKeyStore.clear();
      this._schedulerStore.forEach((scheduler) => {
        scheduler.clear();
      });
      this._schedulerStore.clear();
    }
  }
}

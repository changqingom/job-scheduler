/**
 * 任务执行结果
 */
export type ITaskResult = void | {
  data?: { [key: string]: any };
  scope?: any;
};
/**
 * 任务接口
 */
export interface ITask {
  /**
   * 执行任务
   */
  run: (
    this: { jobScheduler: IJobScheduler; job: IJob; task: ITask },
    previousTaskResult: ITaskResult
  ) => Promise<ITaskResult>;
}
/**
 * 工作接口
 */
export interface IJob {
  get id(): string;
  get freeze(): boolean;
  set freeze(value: boolean);
  get queue(): ITask[];
  add: (task: ITask) => IJob;
  run: (
    this: { jobScheduler: IJobScheduler; job: IJob },
    previousTaskResult: ITaskResult
  ) => Promise<ITaskResult>;
}

/**
 * 任务调度器
 */
export interface IJobScheduler {
  get id(): string;
  get activeJob(): IJob;
  get paused(): boolean;
  /**
   * 添加工作
   *
   * 如果传入调度器id则将工作添加到该id对应的调度器,调度器并行执行,工作串行执行
   */
  add(job: IJob, schedulerId?: string): IJobScheduler;
  /**
   * 移除工作
   */
  remove(jobId: string, schedulerId?: string): boolean;
  /**
   * 传入调度器id则只暂停对应的调度器
   */
  pause(key?: string, schedulerId?: string): string;
  /**
   * 传入调度器id则只恢复对应的调度器
   */
  resume(key?: string, schedulerId?: string): boolean;
  /**
   * 传入调度器id则只清空对应的调度器
   */
  clear(schedulerId?: string): IJobScheduler;
}

function defined(value: any) {
  return value !== void 0 && value !== null;
}

export class BaseJob implements IJob {
  private _id: string;
  get id(): string {
    return this._id;
  }
  private _freeze = false;
  get freeze(): boolean {
    return this._freeze;
  }
  set freeze(value: boolean) {
    this._freeze = value;
  }
  private _queue: ITask[] = [];
  get queue(): ITask[] {
    return this._queue;
  }
  constructor(options: { id?: string; tasks?: ITask[] } = {}) {
    this._id = options.id || performance.now() + "";
    if (options.tasks) {
      for (const task of options.tasks) {
        this.add(task);
      }
    }
  }
  add(task: ITask): BaseJob {
    if (!this._freeze) {
      this._queue.push(task);
    } else {
      console.warn("工作已冻结,不可再添加");
    }
    return this;
  }
  async run(
    this: { jobScheduler: IJobScheduler; job: IJob },
    previousTaskResult: ITaskResult
  ): Promise<ITaskResult> {
    this.job.freeze = true;
    for (const task of this.job.queue) {
      previousTaskResult = await task.run.call(
        { jobScheduler: this.jobScheduler, job: this.job, task },
        previousTaskResult
      );
    }
    return previousTaskResult;
  }
}

export class JobScheduler implements IJobScheduler {
  private _id: string = performance.now() + "";
  get id(): string {
    return this._id;
  }
  private _schedulerStore: Map<string, JobScheduler> = new Map<
    string,
    JobScheduler
  >();
  private _jobQueue: IJob[] = [];
  private _paused = false;
  get paused(): boolean {
    return this._paused;
  }
  private _pauseKeyStore = new Set<string>();
  private _activeJob: IJob;
  get activeJob(): IJob {
    return this._activeJob;
  }
  private _run(previousTaskResult: ITaskResult) {
    this._activeJob = this._jobQueue[0];
    if (this._activeJob && !this._paused) {
      this._activeJob.run
        .call({ jobScheduler: this, job: this._activeJob }, previousTaskResult)
        .then((taskResult) => {
          this._jobQueue = this._jobQueue.slice(1);
          this._activeJob = void 0;
          this._run(taskResult);
        });
    }
  }
  /**
   * 添加工作
   *
   * 如果传入调度器id则将工作添加到该id对应的调度器,调度器并行执行,工作串行执行
   */
  add(job: BaseJob, schedulerId?: string): JobScheduler {
    if (defined(schedulerId)) {
      this._schedulerStore.has(schedulerId) ||
        this._schedulerStore.set(schedulerId, new JobScheduler());
      this._schedulerStore.get(schedulerId).add(job);
    } else {
      this._jobQueue.push(job);
      this._jobQueue.length === 1 && this._run();
    }
    return this;
  }
  /**
   * 移除工作
   */
  remove(jobId: string, schedulerId?: string): boolean {
    if (defined(schedulerId)) {
      return this._schedulerStore.get(schedulerId)?.remove(jobId) || false;
    } else if (jobId !== this._activeJob?.id) {
      this._jobQueue = this._jobQueue.filter((i) => i.id !== jobId);
      return true;
    }
    console.warn("执行中的工作不可删除");
    return false;
  }
  /**
   * 传入调度器id则只暂停对应的调度器
   */
  pause(key?: string, schedulerId?: string): string {
    if (defined(schedulerId)) {
      return this._schedulerStore.get(schedulerId)?.pause(key);
    }
    key || (key = performance.now() + "");
    this._pauseKeyStore.add(key);
    this._paused = true;
    return key;
  }
  /**
   * 传入调度器id则只恢复对应的调度器
   */
  resume(key?: string, schedulerId?: string): boolean {
    if (defined(schedulerId)) {
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
  /**
   * 传入调度器id则只清空对应的调度器
   */
  clear(schedulerId?: string): JobScheduler {
    if (defined(schedulerId)) {
      this._schedulerStore.get(schedulerId)?.clear();
    } else {
      this._jobQueue = [];
      this._pauseKeyStore.clear();
      this._schedulerStore.forEach((scheduler) => {
        scheduler.clear();
      });
      this._schedulerStore.clear();
    }
    return this;
  }
}

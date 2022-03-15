/**
 * 工作执行结果
 */
export interface ITaskResult {
  data?: { [key: string]: any };
  scope?: any;
}
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
  run: () => Promise<void>;
}
/**
 * 任务调度器
 */
export interface IJobScheduler {
  add(job: IJob): void;
  pause(key?: string): string;
  resume(key: string): boolean;
  clear();
}

export class BaseJob implements IJob {
  private _freeze = false;
  private _queue: ITask[] = [];
  id: string;
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
  async run(): Promise<void> {
    this._freeze = true;
    let previousTaskResult;
    for (const task of this._queue) {
      previousTaskResult = await task.run(previousTaskResult);
    }
  }
}

export class JobScheduler implements IJobScheduler {
  private _queue: IJob[] = [];
  private _paused = false;
  private _pauseKeyStore = new Set<string>();
  private _job: IJob;
  private _run() {
    this._job = this._queue[0];
    if (this._job && !this._paused) {
      this._job.run().then(() => {
        this._queue = this._queue.slice(1);
        this._run();
      });
    }
  }
  add(job: IJob): void {
    this._queue.push(job);
    this._queue.length === 1 && this._run();
  }
  remove(jobId: string) {
    if (jobId !== this._job?.id) {
      this._queue = this._queue.filter((i) => i.id !== jobId);
    }
  }
  pause(key?: string): string {
    key || (key = performance.now() + "");
    this._pauseKeyStore.add(key);
    this._paused = true;
    return key;
  }
  resume(key?: string): boolean {
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
  clear() {
    this._queue = [];
    this._pauseKeyStore.clear();
  }
}

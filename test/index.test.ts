import { JobScheduler, BaseJob, ITaskResult } from "../src/index";

const sleep = (time) =>
  new Promise((resolve) => setTimeout(resolve, time * 1000));

test("单任务", () => {
  const scheduler = new JobScheduler();
  return new Promise((resolve) => {
    scheduler.add(
      new BaseJob({
        tasks: [
          {
            async run(res?: ITaskResult) {
              expect(res).toBeUndefined();
              resolve(void 0);
              return;
            },
          },
        ],
      })
    );
  });
});

test("任务间传参", () => {
  const scheduler = new JobScheduler();
  return new Promise((resolve) => {
    scheduler.add(
      new BaseJob({
        tasks: [
          {
            async run(res) {
              expect(res).toBeUndefined();
              return {
                data: { name: 1 },
              };
            },
          },
          {
            async run(res) {
              expect(res).toMatchObject({
                data: { name: 1 },
              });
              return;
            },
          },
          {
            async run(res) {
              expect(res).toBeUndefined();

              return {};
            },
          },
        ],
      })
    );
    scheduler.add(
      new BaseJob({
        tasks: [
          {
            async run(res) {
              expect(res).toMatchObject({});
              resolve(void 0);
              return void 0;
            },
          },
        ],
      })
    );
  });
});

test("工作间传参", () => {
  const scheduler = new JobScheduler();
  return new Promise((resolve) => {
    scheduler.add(
      new BaseJob({
        tasks: [
          {
            async run(res) {
              expect(res).toBeUndefined();
              return {
                data: { name: 1 },
              };
            },
          },
        ],
      })
    );
    scheduler.add(
      new BaseJob({
        tasks: [
          {
            async run(res) {
              expect(res).toMatchObject({
                data: { name: 1 },
              });
            },
          },
        ],
      })
    );
    scheduler.add(
      new BaseJob({
        tasks: [
          {
            async run(res) {
              expect(res).toBeUndefined();
              resolve(void 0);
              return;
            },
          },
        ],
      })
    );
  });
});

test("调度器", async () => {
  const scheduler = new JobScheduler();
  await new Promise((resolve) => {
    scheduler.add(
      new BaseJob({
        tasks: [
          {
            async run(res) {
              expect(res).toBeUndefined();
              resolve(void 0);
              return;
            },
          },
        ],
      })
    );
  });
  await sleep(1);
  expect(scheduler.job).toBeUndefined();
  return;
});

test("工作组", async () => {
  const scheduler = new JobScheduler();
  const schedulerId = "scheduler";
  await new Promise((resolve) => {
    scheduler.add(
      new BaseJob({
        tasks: [
          {
            async run(res) {
              expect(res).toBeUndefined();
              resolve(void 0);
              return { data: { schedulerId } };
            },
          },
        ],
      }),
      schedulerId
    );
    scheduler.add(
      new BaseJob({
        tasks: [
          {
            async run(res) {
              expect(res).toBeUndefined();
              return;
            },
          },
        ],
      })
    );
    scheduler.add(
      new BaseJob({
        tasks: [
          {
            async run(res) {
              expect(res).toMatchObject({ data: { schedulerId } });
              resolve(void 0);
              return;
            },
          },
        ],
      }),
      schedulerId
    );
  });
  await sleep(1);
  expect(scheduler.job).toBeUndefined();
  return;
});

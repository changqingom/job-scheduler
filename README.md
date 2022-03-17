# 任务调度器

---

```javascript
import { JobScheduler, BaseJob } from "light-scheduler";

const sleep = (time) =>
  new Promise((resolve) => setTimeout(resolve, time * 1000));

const scheduler = new JobScheduler();

scheduler.add(
  new BaseJob({
    tasks: [
      {
        async run(res) {
          console.log(1, JSON.stringify(res));
          await sleep(2);
          return {
            data: { name: "single" },
          };
        },
      },
      {
        async run(res) {
          console.log(2, JSON.stringify(res));
          await sleep(2);
          return res;
        },
      },
      {
        async run(res) {
          console.log(3, JSON.stringify(res));
          await sleep(2);
          return res;
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
          console.log(4, JSON.stringify(res));
          await sleep(2);
          return void 0;
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
          console.log(5, JSON.stringify(res));
          await sleep(2);
          return { data: { name: "group1" } };
        },
      },
    ],
  }),
  "group1"
);

scheduler.add(
  new BaseJob({
    tasks: [
      {
        async run(res) {
          console.log(6, JSON.stringify(res));
          await sleep(2);
          return void 0;
        },
      },
    ],
  }),
  "group1"
);

scheduler.add(
  new BaseJob({
    tasks: [
      {
        async run(res) {
          console.log(7, JSON.stringify(res));
          await sleep(2);
          return { data: { name: "group2" } };
        },
      },
    ],
  }),
  "group2"
);

scheduler.add(
  new BaseJob({
    tasks: [
      {
        async run(res) {
          console.log(8, JSON.stringify(res));
          await sleep(2);
          return void 0;
        },
      },
    ],
  }),
  "group2"
);
```

---

参考:

https://mp.weixin.qq.com/s/O6fAOodJq6pyJnqy1IuqEg

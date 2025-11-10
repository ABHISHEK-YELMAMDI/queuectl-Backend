program
  .command("worker start")
  .option("--count <number>", "Number of workers")
  .action((options) => {
    const count = parseInt(options.count) || 1;
    workerService.startWorkers(count);
  });

program
  .command("worker stop")
  .action(() => {
    workerService.stopWorkers();
  });

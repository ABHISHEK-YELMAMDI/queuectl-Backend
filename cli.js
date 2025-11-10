#!/usr/bin/env node
const { program } = require('commander');
const fs = require('fs');
const queueService = require('./src/services/queueService');
const workerService = require('./src/services/workerService');

// -------------------
// Enqueue a job
// -------------------
program
  .command("enqueue [jobStr]")
  .description("Enqueue a job or multiple jobs from file")
  .option("--file <path>", "Path to job JSON file")
  .action(async (jobStr, options) => {
    try {
      let jobs;

      if (options.file) {
        const raw = fs.readFileSync(options.file, "utf-8");
        jobs = JSON.parse(raw);
      } else {
        jobs = [JSON.parse(jobStr)];
      }

      if (!Array.isArray(jobs)) jobs = [jobs];

      for (const job of jobs) {
        if (!job.id || !job.command || !job.max_retries) {
          console.error("Job JSON must have id, command, and max_retries fields:", job);
          continue;
        }

        const result = await queueService.enqueue(job);
        console.log("Job enqueued:", result);
      }
    } catch (err) {
      console.error("Failed to enqueue job:", err.message);
    }
  });

// -------------------
// Dequeue a job
// -------------------
program
  .command('dequeue')
  .description('Get and remove the oldest pending job')
  .action(async () => {
    try {
      const job = await queueService.dequeue();
      if (!job) console.log('No pending jobs.');
      else console.log('Dequeued job:', job);
    } catch (err) {
      console.error('Error:', err.message);
    }
  });

// -------------------
// Peek at next job
// -------------------
program
  .command('peek')
  .description('Peek at the oldest pending job')
  .action(async () => {
    try {
      const job = await queueService.peek();
      if (!job) console.log('No pending jobs.');
      else console.log('Next job:', job);
    } catch (err) {
      console.error('Error:', err.message);
    }
  });

// -------------------
// List all jobs
// -------------------
program
  .command('list')
  .description('List all jobs')
  .action(async () => {
    try {
      const jobs = await queueService.list();
      console.table(jobs);
    } catch (err) {
      console.error('Error:', err.message);
    }
  });

// -------------------
// Worker commands
// -------------------
program
  .command('worker:start')
  .description('Start workers')
  .option('-c, --count <number>', 'Number of workers', '1')
  .action((options) => {
    const count = parseInt(options.count, 10) || 1;
    workerService.startWorkers(count);
  });

program
  .command('worker:stop')
  .description('Stop all workers')
  .action(() => {
    workerService.stopWorkers();
  });

// -------------------
// DLQ commands
// -------------------
program
  .command('dlq:list')
  .description('List all DLQ jobs')
  .action(async () => {
    try {
      const dlqJobs = await queueService.listDLQ();
      console.table(dlqJobs);
    } catch (err) {
      console.error('Error:', err.message);
    }
  });

program
  .command('dlq:retry <jobId>')
  .description('Retry a job from DLQ')
  .action(async (jobId) => {
    try {
      const job = await queueService.retryDLQ(jobId);
      console.log('Job retried:', job);
    } catch (err) {
      console.error('Error:', err.message);
    }
  });

// -------------------
// Status command
// -------------------
program
  .command('status')
  .description('Show summary of jobs & workers')
  .action(async () => {
    try {
      const jobs = await queueService.list();
      const workers = workerService.getWorkerCount ? workerService.getWorkerCount() : 0;

      const summary = {
        total_jobs: jobs.length,
        pending: jobs.filter((j) => j.state === 'pending').length,
        processing: jobs.filter((j) => j.state === 'processing').length,
        completed: jobs.filter((j) => j.state === 'completed').length,
        dead: await queueService.listDLQ().then(dlq => dlq.length),
        active_workers: workers
      };

      console.table(summary);
    } catch (err) {
      console.error('Error:', err.message);
    }
  });

program.parse(process.argv);

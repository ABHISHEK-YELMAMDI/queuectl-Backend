const { exec } = require("child_process");
const db = require("../db/init");

let workers = [];
let stopFlag = false;

// ----------------------------
// Helper: Pick next pending job
// ----------------------------
const pickNextJob = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM jobs
      WHERE state='pending'
      ORDER BY created_at
      LIMIT 1
    `;
    db.get(query, (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(null);

      // Mark as processing
      db.run(
        `UPDATE jobs SET state='processing', updated_at=datetime('now') WHERE id=?`,
        [row.id],
        (err2) => {
          if (err2) return reject(err2);
          resolve(row);
        }
      );
    });
  });
};

// ----------------------------
// Helper: Move job to DLQ
// ----------------------------
const moveToDLQ = (job, reason) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO dlq (id, command, attempts, failed_at, reason)
       VALUES (?, ?, ?, datetime('now'), ?)`,
      [job.id, job.command, job.attempts, reason],
      (err) => {
        if (err) return reject(err);

        // Delete from jobs table
        db.run(`DELETE FROM jobs WHERE id=?`, [job.id], (err2) => {
          if (err2) console.error("Delete from jobs failed:", err2);
          resolve();
        });
      }
    );
  });
};


// ----------------------------
// Helper: Schedule retry with exponential backoff
// ----------------------------
const scheduleRetry = (job) => {
  const base = 2; // configurable base
  const delay = Math.pow(base, job.attempts) * 1000; // ms
  console.log(`Retrying job ${job.id} in ${delay / 1000}s (attempt ${job.attempts})`);

  setTimeout(() => {
    db.run(
      `UPDATE jobs SET state='pending', updated_at=datetime('now') WHERE id=?`,
      [job.id],
      (err) => {
        if (err) console.error("Retry update failed:", err);
      }
    );
  }, delay);
};


exports.retryDLQ = (jobId) => {
  return new Promise((resolve, reject) => {
    // Get job from DLQ
    db.get(`SELECT * FROM dlq WHERE id = ?`, [jobId], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error("Job not found in DLQ"));

      // Insert back into jobs table for re-processing
      db.run(
        `INSERT INTO jobs (id, command, state, attempts, max_retries, created_at, updated_at)
         VALUES (?, ?, 'pending', 0, ?, datetime('now'), datetime('now'))`,
        [row.id, row.command, row.attempts],
        (err2) => {
          if (err2) return reject(err2);

          // Remove from DLQ
          db.run(`DELETE FROM dlq WHERE id = ?`, [jobId], (err3) => {
            if (err3) console.error("Failed to remove job from DLQ:", err3);
            resolve(row);
          });
        }
      );
    });
  });
};


// ----------------------------
// Execute the job
// ----------------------------
const processJob = (job) => {
  return new Promise((resolve) => {
    if (!job) return resolve();

    exec(job.command, async (error, stdout, stderr) => {
      let attempts = (job.attempts || 0) + 1;

      if (error) {
        console.log(`Job ${job.id} failed (attempt ${attempts})`);
        if (attempts > job.max_retries) {
          console.log(`Job ${job.id} exceeded max retries → moving to DLQ`);
          await moveToDLQ({ ...job, attempts }, "Max retries exceeded");
        } else {
          // Update attempts in jobs table
          db.run(
            `UPDATE jobs SET attempts=? , updated_at=datetime('now') WHERE id=?`,
            [attempts, job.id],
            (err) => {
              if (err) console.error("Update attempts failed:", err);
              scheduleRetry({ ...job, attempts });
            }
          );
        }
      } else {
        console.log(`Job ${job.id} completed successfully`);
        db.run(
          `UPDATE jobs SET state='completed', updated_at=datetime('now') WHERE id=?`,
          [job.id]
        );
      }

      resolve();
    });
  });
};

// ----------------------------
// Worker loop
// ----------------------------
const startWorker = (interval = 1000) => {
  stopFlag = false;

  const worker = setInterval(async () => {
    if (stopFlag) return;

    try {
      const job = await pickNextJob();
      if (job) await processJob(job);
    } catch (err) {
      console.error("Worker error:", err);
    }
  }, interval);

  workers.push(worker);
};

// ----------------------------
// Start/Stop Workers
// ----------------------------
const startWorkers = (count = 1) => {
  for (let i = 0; i < count; i++) startWorker();
  console.log(`${count} worker(s) started.`);
};

const stopWorkers = () => {
  stopFlag = true;
  workers.forEach((w) => clearInterval(w));
  workers = [];
  console.log("All workers stopped.");
};

module.exports = { startWorkers, stopWorkers };

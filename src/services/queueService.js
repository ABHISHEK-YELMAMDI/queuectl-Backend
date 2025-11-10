const db = require("../db/init");

// -------------------- QUEUE OPERATIONS --------------------

// Enqueue a job
exports.enqueue = (payload) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO jobs 
      (id, command, state, attempts, max_retries, created_at, updated_at) 
      VALUES (?, ?, 'pending', 0, ?, datetime('now'), datetime('now'))
    `;
    db.run(query, [payload.id, payload.command, payload.max_retries], function (err) {
      if (err) return reject(err);
      resolve({ id: payload.id, command: payload.command });
    });
  });
};

// Dequeue the oldest pending job
exports.dequeue = () => {
  return new Promise((resolve, reject) => {
    const getQuery = `SELECT * FROM jobs WHERE state='pending' ORDER BY created_at LIMIT 1`;
    db.get(getQuery, (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(null);

      const deleteQuery = `DELETE FROM jobs WHERE id = ?`;
      db.run(deleteQuery, [row.id], (err2) => {
        if (err2) return reject(err2);
        resolve(row);
      });
    });
  });
};

// Peek at the oldest pending job
exports.peek = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM jobs WHERE state='pending' ORDER BY created_at LIMIT 1`;
    db.get(query, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

// List all jobs
exports.list = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM jobs ORDER BY created_at`;
    db.all(query, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

// -------------------- DLQ OPERATIONS --------------------

// List all DLQ jobs
exports.listDLQ = () => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM dlq ORDER BY failed_at`;
    db.all(query, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

// Retry a DLQ job by ID
exports.retryDLQ = (id) => {
  return new Promise((resolve, reject) => {
    const getQuery = `SELECT * FROM dlq WHERE id = ?`;
    db.get(getQuery, [id], (err, row) => {
      if (err) return reject(err);
      if (!row) return resolve(null);

      const insertQuery = `
        INSERT INTO jobs (id, command, state, attempts, max_retries, created_at, updated_at)
        VALUES (?, ?, 'pending', 0, 3, datetime('now'), datetime('now'))
      `;
      db.run(insertQuery, [row.id, row.command], (err2) => {
        if (err2) return reject(err2);

        db.run(`DELETE FROM dlq WHERE id = ?`, [id], (err3) => {
          if (err3) return reject(err3);
          resolve({ retried: true, id: row.id });
        });
      });
    });
  });
};


exports.getJobStatus = (jobId) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT id, state, attempts, max_retries, created_at, updated_at FROM jobs WHERE id=?`;
    db.get(query, [jobId], (err, row) => {
      if (err) return reject(err);
      resolve(row); // returns null if job not found
    });
  });
};

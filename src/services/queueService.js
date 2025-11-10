const db = require("../db/init");

// Enqueue a job
exports.enqueue = (payload) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO jobs 
      (id, command, state, attempts, max_retries, created_at, updated_at) 
      VALUES (?, ?, 'pending', 0, ?, datetime('now'), datetime('now'))`;

    db.run(
      query,
      [payload.id, payload.command, payload.max_retries],
      function (err) {
        if (err) return reject(err);
        resolve({ id: payload.id, command: payload.command });
      }
    );
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

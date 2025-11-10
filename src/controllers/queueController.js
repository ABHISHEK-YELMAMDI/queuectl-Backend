const queueService = require("../services/queueService");
const workerService = require("../services/workerService");

// -------------------- QUEUE CONTROLLERS --------------------

exports.enqueue = async (req, res) => {
  try {
    const data = await queueService.enqueue(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.dequeue = async (req, res) => {
  try {
    const data = await queueService.dequeue();
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.peek = async (req, res) => {
  try {
    const data = await queueService.peek();
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const data = await queueService.list();
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// -------------------- WORKER CONTROLLERS --------------------

exports.startWorkers = (req, res) => {
  const count = parseInt(req.query.count) || 1;
  workerService.startWorkers(count);
  res.json({ success: true, message: `${count} worker(s) started` });
};

exports.stopWorkers = (req, res) => {
  workerService.stopWorkers();
  res.json({ success: true, message: "All workers stopped" });
};

// -------------------- DLQ CONTROLLERS --------------------

exports.listDLQ = async (req, res) => {
  try {
    const data = await queueService.listDLQ();
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.retryDLQ = async (req, res) => {
  try {
    const data = await queueService.retryDLQ(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "DLQ job not found" });
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

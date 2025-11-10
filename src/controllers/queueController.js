const queueService = require("../services/queueService");

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

const workerService = require("../services/workerService");

exports.startWorkers = (req, res) => {
  const count = parseInt(req.query.count) || 1;
  workerService.startWorkers(count);
  res.json({ success: true, message: `${count} worker(s) started` });
};

exports.stopWorkers = (req, res) => {
  workerService.stopWorkers();
  res.json({ success: true, message: "All workers stopped" });
};


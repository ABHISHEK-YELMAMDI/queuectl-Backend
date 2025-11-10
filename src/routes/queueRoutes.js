const express = require("express");
const router = express.Router();
const queueController = require("../controllers/queueController");

router.post("/enqueue", queueController.enqueue);
router.get("/dequeue", queueController.dequeue);
router.get("/peek", queueController.peek);
router.get("/list", queueController.list);
router.post("/worker/start", queueController.startWorkers);
router.post("/worker/stop", queueController.stopWorkers);


module.exports = router;

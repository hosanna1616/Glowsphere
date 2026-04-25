const express = require("express");
const auth = require("../middleware/auth");
const { getLogs, createLog, deleteLog } = require("../controllers/luminaLogController");

const router = express.Router();

router.route("/").get(auth, getLogs).post(auth, createLog);
router.route("/:id").delete(auth, deleteLog);

module.exports = router;

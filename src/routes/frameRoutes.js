const express = require('express');
const router = express.Router();
const frame = require("../controllers/frameController");
router.post('/addFrame',frame.addFrame);
router.delete('/:frameId',frame.deleteFrame);
router.get('/allFrames',frame.getAllFrames);
router.put('/:frameId', frame.UpdateFrame)

module.exports = router;

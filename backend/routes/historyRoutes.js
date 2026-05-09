const express = require('express');
const router = express.Router();
const { getHistory, deleteHistory, clearHistory } = require('../controllers/historyController');

router.get('/', getHistory);
router.delete('/:id', deleteHistory);
router.delete('/', clearHistory);

module.exports = router;

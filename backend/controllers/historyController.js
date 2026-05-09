const fs = require('fs');
const path = require('path');

const isVercel = process.env.VERCEL === "1";
const historyFile = isVercel 
  ? "/tmp/history.json" 
  : path.join(__dirname, '../data/history.json');

const readHistory = () => {
  try {
    if (fs.existsSync(historyFile)) {
      return JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }
  } catch (e) {
    console.log("Error reading history", e);
  }
  return [];
};

const writeHistory = (data) => {
  try {
    fs.writeFileSync(historyFile, JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("Error writing history", e);
  }
};

const getHistory = (req, res) => {
  const sessions = readHistory();
  res.json({ success: true, sessions });
};

const saveHistory = (session) => {
  const sessions = readHistory();
  sessions.unshift(session);
  writeHistory(sessions);
};

const deleteHistory = (req, res) => {
  const { id } = req.params;
  let sessions = readHistory();
  sessions = sessions.filter(s => String(s.id) !== String(id));
  writeHistory(sessions);
  res.json({ success: true });
};

const clearHistory = (req, res) => {
  writeHistory([]);
  res.json({ success: true });
};

module.exports = { getHistory, saveHistory, deleteHistory, clearHistory };

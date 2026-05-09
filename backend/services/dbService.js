const path = require("path");
const fs = require("fs");

// Use a simple JSON file as database (no native build needed)
const DB_PATH = path.join(__dirname, "../data/history.json");

// Ensure data directory exists
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify([]));

function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch {
    return [];
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

/**
 * Save a bill session to history
 */
function saveSession(sessionData) {
  const sessions = readDB();
  const newSession = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...sessionData,
  };
  sessions.unshift(newSession); // newest first
  // Keep max 100 records
  if (sessions.length > 100) sessions.splice(100);
  writeDB(sessions);
  return newSession;
}

/**
 * Get all sessions (newest first)
 */
function getAllSessions() {
  return readDB();
}

/**
 * Get a single session by ID
 */
function getSession(id) {
  const sessions = readDB();
  return sessions.find((s) => s.id === id) || null;
}

/**
 * Delete a session by ID
 */
function deleteSession(id) {
  const sessions = readDB();
  const filtered = sessions.filter((s) => s.id !== id);
  writeDB(filtered);
  return filtered.length < sessions.length;
}

/**
 * Clear all history
 */
function clearAllSessions() {
  writeDB([]);
}

module.exports = { saveSession, getAllSessions, getSession, deleteSession, clearAllSessions };

import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('cache.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS top_items (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      lastUpdated INTEGER NOT NULL
    )
  `);
});

export default db;

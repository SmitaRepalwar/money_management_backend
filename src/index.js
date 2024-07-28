const express = require("express");
const mysql = require('mysql2/promise');
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(bodyParser.json());

let db;

// Function to initialize database connection
async function initDB() {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('Connected to the database as id ' + db.threadId);
  } catch (err) {
    console.error('Error connecting to the database:', err.stack);
  }
}

// Call the function to initialize database connection
initDB();

app.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM transactions';
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/add', async (req, res) => {
  try {
    const { id, type, amount, description, date } = req.body;

    const getQuery = 'SELECT running_balance FROM transactions ORDER BY id DESC LIMIT 1';
    const [results] = await db.query(getQuery);

    let balance = results.length > 0 ? results[0].running_balance : 0;

    const formattedDate = new Date(date).toISOString().slice(0, 19).replace('T', ' ');

    let running_balance;
    switch (type) {
      case 'credit':
        running_balance = parseInt(balance) + parseInt(amount);
        break;
      case 'debit':
        running_balance = parseInt(balance) - parseInt(amount);
        break;
      default:
        return res.status(400).json({ error: 'Invalid transaction type' });
    }

    const data = { id, type, amount, description, date: formattedDate, running_balance };

    const query = 'INSERT INTO transactions SET ?';
    await db.query(query, data);
    res.status(201).json({ message: 'Transaction added successfully' });

  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

const port = process.env.PORT || 4000;
const HOST = '0.0.0.0'; // Bind to all network interfaces

app.listen(port, HOST, () => {
  console.log(`Listening at port number ${HOST}:${port}`);
});

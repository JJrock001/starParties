require('dotenv').config();

const cors = require('cors');
const express = require('express');

const connectDB = require('./config/db');
const apiRoutes = require('./routes');

const app = express();
const port = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiRoutes);

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});

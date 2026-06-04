require('dotenv').config();

const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const apiRoutes = require('./routes');

const app = express();
const port = process.env.PORT || 5001;
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';

const isAllowedLocalOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch (error) {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === frontendOrigin || isAllowedLocalOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiRoutes);

const start = async () => {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message || err);
    process.exit(1);
  }
};

start();

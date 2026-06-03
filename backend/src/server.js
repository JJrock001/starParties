require('dotenv').config();

const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const apiRoutes = require('./routes');
const Room = require('./models/Room');

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

const seedDefaultRoom = async () => {
  const roomCount = await Room.countDocuments();

  if (roomCount === 0) {
    await Room.create({
      roomName: 'Band Room',
      roomCode: 'BR-101',
      isAvailable: true,
    });
  }
};

const start = async () => {
  try {
    await connectDB();

    try {
      await seedDefaultRoom();
    } catch (seedErr) {
      console.error('Room seed failed:', seedErr.message || seedErr);
    }

    app.listen(port, () => {
      console.log(`API running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message || err);
    process.exit(1);
  }
};

start();

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

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});

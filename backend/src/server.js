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
const defaultRoomImage =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgdmlld0JveD0iMCAwIDY0MCAzNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzEzMjEzYSIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMyYTNhNGYiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSI2NDAiIGhlaWdodD0iMzYwIiByeD0iMzYiIGZpbGw9InVybCgjZykiLz4KICA8Y2lyY2xlIGN4PSIxOTAiIGN5PSIxODAiIHI9Ijg4IiBmaWxsPSIjMWYyOTM3IiBmaWx0ZXI9InVybCgjc2hhZG93KSIvPgogIDxwYXRoIGQ9Ik0xNTYgMTY4YzE0LTM2IDY0LTYwIDg0LTYwczcwIDI0IDg0IDYwYzkgMjMgMTQgNTAgMTQgNjV2NDBoLTIyMmwtLTAtNDBjMC0xNSA1LTQyIDE0LTY1eiIgZmlsbD0iI2VjZjBmMyIgZmlsbC1vcGFjaXR5PSIwLjE1Ii8+CiAgPHRleHQgeD0iMzYwIiB5PSIxNTUiIGZpbGw9IiNlYzRmZjMiIGZvbnQtZmFtaWx5PSJJbnRlciwgQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZvbnQtd2VpZ2h0PSI3MDAiPlJhZXVtPC90ZXh0PgogIDx0ZXh0IHg9IjM2MCIgeT0iMjA1IiBmaWxsPSIjYjJjOGQ4IiBmb250LWZhbWlseT0iSW50ZXIsIEFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjIyIj5TdGFycGFydGllcyBibmQgcm9vbTwvdGV4dD4KPC9zdmc+';

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
      roomImage: defaultRoomImage,
      isAvailable: true,
    });
    return;
  }

  await Room.updateMany(
    {
      $or: [{ roomImage: { $exists: false } }, { roomImage: '' }, { roomImage: null }],
    },
    {
      $set: { roomImage: defaultRoomImage },
    }
  );
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

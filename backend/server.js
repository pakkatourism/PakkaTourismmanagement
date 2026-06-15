const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

// Connect Database
connectDB();

const app = express();
const httpServer = http.createServer(app);

// ─── Socket.io Setup ─────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Authenticate socket connections via JWT
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) return next(new Error('User not found'));
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user._id.toString();
  // Join user's personal room for targeted notifications
  socket.join(`user_${userId}`);
  console.log(`🔌 Socket connected: ${socket.user.name} (${socket.user.role})`);

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.user.name}`);
  });
});

// Make io accessible in controllers via req.app.get('io')
app.set('io', io);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',           require('./routes/auth'));
app.use('/api/attendance',     require('./routes/attendance'));
app.use('/api/leads',          require('./routes/leads'));
app.use('/api/notifications',  require('./routes/notifications'));
app.use('/api/quotes',         require('./routes/quotes'));
app.use('/api/pricing',        require('./routes/pricing'));
app.use('/api/bookings',       require('./routes/bookings'));
app.use('/api/vendors',        require('./routes/vendors'));
app.use('/api/finance',        require('./routes/finance'));
app.use('/api/itinerary',      require('./routes/itinerary'));
app.use('/api/analytics',      require('./routes/analytics'));
app.use('/api/whatsapp',       require('./routes/whatsapp'));
app.use('/api/settings',       require('./routes/settings'));
app.use('/api/exports',        require('./routes/exports'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'Pakka Tourism CRM API', version: '2.0.0', socket: 'enabled' });
});

// Error Handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Pakka Tourism CRM Server running on port ${PORT}`);
  console.log(`   Mode:   ${process.env.NODE_ENV}`);
  console.log(`   API:    http://localhost:${PORT}/api/health`);
  console.log(`   Socket: enabled (JWT auth)\n`);
});

module.exports = app;

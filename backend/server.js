const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const submissionRoutes = require('./routes/submissions');
const eventRoutes = require('./routes/events');
const newsRoutes = require('./routes/news');
const donationRoutes = require('./routes/donations');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..')));

app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/upload', uploadRoutes);

initDatabase().catch((err) => {
  console.error('Failed to initialize database:', err);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`GGM Server running at http://localhost:${PORT}`);
    console.log(`API: http://localhost:${PORT}/api`);
  });
}

module.exports = app;
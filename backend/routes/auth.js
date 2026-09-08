const express = require('express');
const bcrypt = require('bcryptjs');
const { supabase } = require('../database');
const { generateToken, verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .limit(1);
  if (error) return res.status(500).json({ error: error.message });
  const user = users && users[0];
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = generateToken(user);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

router.post('/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .limit(1);
  if (error) return res.status(500).json({ error: error.message });
  const user = users && users[0];
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: hash })
    .eq('id', req.user.id);
  if (updateError) return res.status(500).json({ error: updateError.message });
  res.json({ message: 'Password updated successfully' });
});

module.exports = router;
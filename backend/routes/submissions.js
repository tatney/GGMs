const express = require('express');
const { supabase } = require('../database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', async (req, res) => {
  const { type, name, email, phone, title, message, category } = req.body;
  if (!type || !name || !email) {
    return res.status(400).json({ error: 'Type, name, and email required' });
  }
  const { data, error } = await supabase.from('submissions').insert({
    type,
    name,
    email,
    phone: phone || null,
    title: title || null,
    message: message || null,
    category: category || null
  }).select('id');
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ id: data && data[0] && data[0].id, message: 'Submission received' });
});

router.get('/', verifyToken, async (req, res) => {
  const { type } = req.query;
  let query = supabase.from('submissions').select('*');
  if (type && type !== 'all') {
    query = query.eq('type', type);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/:id/read', verifyToken, async (req, res) => {
  const { error } = await supabase
    .from('submissions')
    .update({ status: 'read' })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Marked as read' });
});

router.delete('/:id', verifyToken, async (req, res) => {
  const { error } = await supabase.from('submissions').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Deleted' });
});

module.exports = router;
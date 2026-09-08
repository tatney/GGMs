const express = require('express');
const { supabase } = require('../database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', verifyToken, async (req, res) => {
  const { title, category, date, time, location, image, description } = req.body;
  if (!title || !date) {
    return res.status(400).json({ error: 'Title and date required' });
  }
  const { data, error } = await supabase.from('events').insert({
    title,
    category: category || 'Worship',
    date,
    time: time || null,
    location: location || null,
    image: image || null,
    description: description || null
  }).select('id');
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ id: data && data[0] && data[0].id, message: 'Event created' });
});

router.put('/:id', verifyToken, async (req, res) => {
  const { title, category, date, time, location, image, description } = req.body;
  const { error } = await supabase
    .from('events')
    .update({ title, category, date, time, location, image, description })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Event updated' });
});

router.delete('/:id', verifyToken, async (req, res) => {
  const { error } = await supabase.from('events').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Event deleted' });
});

module.exports = router;
const express = require('express');
const { supabase } = require('../database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', async (req, res) => {
  const { amount, frequency, category, donor_name, email, payment_method, notes } = req.body;
  if (!amount || !donor_name || !email) {
    return res.status(400).json({ error: 'Amount, name, and email required' });
  }
  const { data, error } = await supabase.from('donations').insert({
    amount,
    frequency: frequency || 'one-time',
    category: category || 'Offering',
    donor_name,
    email,
    payment_method: payment_method || null,
    notes: notes || null
  }).select('id');
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ id: data && data[0] && data[0].id, message: 'Donation recorded' });
});

router.get('/', verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/stats', verifyToken, async (req, res) => {
  const { data, error } = await supabase.from('donations').select('amount, category');
  if (error) return res.status(500).json({ error: error.message });
  const total = data.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const byCategoryMap = {};
  for (const d of data) {
    const cat = d.category || 'Offering';
    byCategoryMap[cat] = (byCategoryMap[cat] || 0) + Number(d.amount || 0);
  }
  res.json({ total, count: data.length, byCategory: Object.entries(byCategoryMap).map(([category, total]) => ({ category, total })) });
});

module.exports = router;
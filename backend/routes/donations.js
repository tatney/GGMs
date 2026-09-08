const express = require('express');
const { supabase } = require('../database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

function generateReference() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = '';
  for (let i = 0; i < 6; i++) {
    ref += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return `GGM-${ref}`;
}

async function uniqueReference() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = generateReference();
    const { data } = await supabase.from('donations').select('id').eq('reference', reference).limit(1);
    if (!data || data.length === 0) return reference;
  }
  return `GGM-${Date.now().toString(36).toUpperCase()}`;
}

router.get('/', verifyToken, async (req, res) => {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { amount, frequency, category, donor_name, email, payment_method, notes } = req.body;
  if (!amount || !donor_name || !email) {
    return res.status(400).json({ error: 'Amount, name, and email required' });
  }
  const reference = await uniqueReference();
  const { data, error } = await supabase.from('donations').insert({
    amount,
    frequency: frequency || 'one-time',
    category: category || 'Offering',
    donor_name,
    email,
    payment_method: payment_method || null,
    notes: notes || null,
    reference,
    status: 'pending'
  }).select('id, reference, status').single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ id: data.id, reference: data.reference, status: data.status, message: 'Donation pledge received' });
});

router.patch('/:id/confirm', verifyToken, async (req, res) => {
  const { error } = await supabase
    .from('donations')
    .update({ status: 'completed', confirmed_at: new Date().toISOString() })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Donation confirmed' });
});

router.patch('/:id/pending', verifyToken, async (req, res) => {
  const { error } = await supabase
    .from('donations')
    .update({ status: 'pending', confirmed_at: null })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Donation marked as pending' });
});

router.delete('/:id', verifyToken, async (req, res) => {
  const { error } = await supabase.from('donations').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Donation removed' });
});

router.get('/stats', verifyToken, async (req, res) => {
  const { data, error } = await supabase.from('donations').select('amount, category, status');
  if (error) return res.status(500).json({ error: error.message });
  const completed = data.filter(d => d.status === 'completed');
  const total = completed.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const byCategoryMap = {};
  for (const d of completed) {
    const cat = d.category || 'Offering';
    byCategoryMap[cat] = (byCategoryMap[cat] || 0) + Number(d.amount || 0);
  }
  res.json({
    total,
    count: completed.length,
    pending: data.length - completed.length,
    all: data.length,
    byCategory: Object.entries(byCategoryMap).map(([category, total]) => ({ category, total }))
  });
});

module.exports = router;
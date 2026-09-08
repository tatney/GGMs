const express = require('express');
const { supabase } = require('../database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

router.get('/', async (req, res) => {
  const { category } = req.query;
  let query = supabase.from('news_articles').select('*');
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:slug', async (req, res) => {
  const { data, error } = await supabase
    .from('news_articles')
    .select('*')
    .eq('slug', req.params.slug)
    .limit(1);
  if (error) return res.status(500).json({ error: error.message });
  const article = data && data[0];
  if (!article) return res.status(404).json({ error: 'Article not found' });
  res.json(article);
});

router.post('/', verifyToken, async (req, res) => {
  const { title, excerpt, content, image, category, author } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const slug = slugify(title);
  const { data, error } = await supabase.from('news_articles').insert({
    title,
    slug,
    excerpt: excerpt || null,
    content: content || null,
    image: image || null,
    category: category || 'Church News',
    author: author || 'Admin',
    published_at: new Date().toISOString()
  }).select('id, slug');
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ id: data && data[0] && data[0].id, slug, message: 'Article created' });
});

router.put('/:id', verifyToken, async (req, res) => {
  const { title, excerpt, content, image, category, author } = req.body;
  const patch = { excerpt, content, image, category, author };
  if (title) {
    patch.title = title;
    patch.slug = slugify(title);
  }
  const { error } = await supabase
    .from('news_articles')
    .update(patch)
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Article updated' });
});

router.delete('/:id', verifyToken, async (req, res) => {
  const { error } = await supabase.from('news_articles').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Article deleted' });
});

module.exports = router;
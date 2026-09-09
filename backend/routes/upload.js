const express = require('express');
const { supabase } = require('../database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

const MIME_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const ALLOWED_FOLDERS = ['events', 'news'];
const BUCKET = 'images';

router.post('/', verifyToken, async (req, res) => {
  const { folder, dataUrl } = req.body || {};
  if (!ALLOWED_FOLDERS.includes(folder)) {
    return res.status(400).json({ error: 'Invalid upload folder' });
  }
  if (typeof dataUrl !== 'string' || dataUrl.length > 14 * 1024 * 1024) {
    return res.status(400).json({ error: 'Invalid image data' });
  }
  const m = dataUrl.match(/^data:([a-zA-Z0-9+.-]+\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!m || !m[2] || !MIME_EXT[m[1]]) {
    return res.status(400).json({ error: 'Only JPG, PNG or WEBP images are supported' });
  }
  const buffer = Buffer.from(m[2], 'base64');
  if (!buffer.length || buffer.length > 8 * 1024 * 1024) {
    return res.status(400).json({ error: 'Image file too large or empty' });
  }
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${MIME_EXT[m[1]]}`;
  const path = `${folder}/${name}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: m[1],
    cacheControl: '3600',
    upsert: false
  });
  if (uploadError) {
    return res.status(500).json({ error: `Upload failed: ${uploadError.message}` });
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  res.status(201).json({ url: data.publicUrl });
});

module.exports = router;
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const rateLimit = require('express-rate-limit');
const QRCode = require('qrcode');
const { nanoid } = require('nanoid');
const path = require('path');

const app = express();
const prisma = new PrismaClient();

app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many links created. Try again in an hour.' }
});

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function baseUrl() {
  return process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
}

// ── API ─────────────────────────────────────────────────────

app.get('/api/links', async (req, res) => {
  try {
    const links = await prisma.link.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { clicks: true } } }
    });
    res.json(links.map(({ _count, ...l }) => ({ ...l, clickCount: _count.clicks })));
  } catch {
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

app.post('/api/links', createLimiter, async (req, res) => {
  const { url, slug, expiresAt } = req.body;

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: 'Please enter a valid URL starting with http:// or https://' });
  }

  const rawSlug = slug?.trim();
  if (rawSlug && !/^[a-zA-Z0-9_-]+$/.test(rawSlug)) {
    return res.status(400).json({ error: 'Slug can only contain letters, numbers, hyphens, and underscores' });
  }

  const finalSlug = rawSlug || nanoid(6);

  try {
    const link = await prisma.link.create({
      data: { slug: finalSlug, url, expiresAt: expiresAt ? new Date(expiresAt) : null }
    });
    res.status(201).json({ ...link, shortUrl: `${baseUrl()}/${link.slug}` });
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(409).json({ error: `The slug "${finalSlug}" is already taken. Choose a different one.` });
    }
    res.status(500).json({ error: 'Failed to create link' });
  }
});

app.delete('/api/links/:slug', async (req, res) => {
  try {
    await prisma.link.delete({ where: { slug: req.params.slug } });
    res.json({ success: true });
  } catch {
    res.status(404).json({ error: 'Link not found' });
  }
});

app.get('/api/links/:slug/clicks', async (req, res) => {
  const link = await prisma.link.findUnique({
    where: { slug: req.params.slug },
    include: { clicks: { orderBy: { createdAt: 'asc' } } }
  });
  if (!link) return res.status(404).json({ error: 'Not found' });
  res.json(link.clicks);
});

app.get('/api/links/:slug/qr', async (req, res) => {
  const link = await prisma.link.findUnique({ where: { slug: req.params.slug } });
  if (!link) return res.status(404).json({ error: 'Not found' });
  const shortUrl = `${baseUrl()}/${link.slug}`;
  const qr = await QRCode.toDataURL(shortUrl, {
    width: 300,
    margin: 2,
    color: { dark: '#e6edf3', light: '#161b22' }
  });
  res.json({ qr, url: shortUrl });
});

// ── Static client in production ──────────────────────────────

const CLIENT_DIST = path.join(__dirname, '../../client/dist');

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(CLIENT_DIST));
}

// ── Redirect ─────────────────────────────────────────────────

app.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  if (slug.includes('.')) {
    return process.env.NODE_ENV === 'production'
      ? res.sendFile(path.join(CLIENT_DIST, 'index.html'))
      : res.status(404).end();
  }

  const link = await prisma.link.findUnique({ where: { slug } });

  if (!link) {
    return process.env.NODE_ENV === 'production'
      ? res.sendFile(path.join(CLIENT_DIST, 'index.html'))
      : res.status(404).json({ error: 'Link not found' });
  }

  if (link.expiresAt && link.expiresAt < new Date()) {
    return res.status(410).send('This link has expired.');
  }

  // Geolocation (best-effort, non-blocking)
  let country = null;
  try {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
    if (ip && !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip)) {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=country`);
      const geo = await geoRes.json();
      country = geo.country || null;
    }
  } catch { /* non-blocking */ }

  await prisma.click.create({ data: { linkId: link.id, country } });

  res.redirect(301, link.url);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

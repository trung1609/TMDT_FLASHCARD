// Vercel Serverless Function: Cloud Short-Code & URL Relay
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST: Shorten a sync URL
  if (req.method === 'POST') {
    try {
      let targetUrl = '';
      if (req.body) {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        if (body.url) {
          targetUrl = body.url;
        }
      }

      if (!targetUrl) {
        return res.status(400).json({ error: 'Missing url to shorten' });
      }

      // 1. Try is.gd
      try {
        const isgdResp = await fetch('https://is.gd/create.php?format=json&url=' + encodeURIComponent(targetUrl));
        if (isgdResp.ok) {
          const data = await isgdResp.json();
          if (data && data.shorturl) {
            const shortId = data.shorturl.split('/').filter(Boolean).pop();
            return res.status(200).json({ shortUrl: data.shorturl, id: shortId, success: true });
          }
        }
      } catch (err1) {
        console.warn('is.gd failed, trying TinyURL:', err1);
      }

      // 2. Fallback to TinyURL
      try {
        const tinyResp = await fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(targetUrl));
        if (tinyResp.ok) {
          const shortUrl = (await tinyResp.text()).trim();
          const shortId = shortUrl.split('/').filter(Boolean).pop();
          return res.status(200).json({ shortUrl, id: shortId, success: true });
        }
      } catch (err2) {
        console.warn('TinyURL failed:', err2);
      }

      return res.status(500).json({ error: 'Failed to create short link' });
    } catch (e) {
      console.error('POST /api/sync failed:', e);
      return res.status(500).json({ error: e.message });
    }
  }

  // GET: Resolve a short code or forward URL
  if (req.method === 'GET') {
    const code = req.query.id || req.query.code || req.query.c;
    const shortUrl = req.query.url || (code ? ('https://is.gd/' + code) : null);
    if (!shortUrl) return res.status(400).json({ error: 'Missing short url or code' });

    try {
      const resp = await fetch('https://is.gd/forward.php?format=json&shorturl=' + encodeURIComponent(shortUrl));
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.url) {
          return res.status(200).json({ url: data.url, success: true });
        }
      }
      return res.status(404).json({ error: 'Short link not found' });
    } catch (e) {
      console.error('GET /api/sync failed:', e);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

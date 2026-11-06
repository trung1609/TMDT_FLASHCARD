// Vercel Serverless Function: Cloud State Sync Relay
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST: Upload state & return short sync ID
  if (req.method === 'POST') {
    try {
      const state = req.body;
      const resp = await fetch('https://api.restful-api.dev/objects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'TMDT_CSE703102_SYNC',
          data: {
            state: state,
            createdAt: Date.now(),
            expiresAt: Date.now() + 3 * 24 * 60 * 60 * 1000
          }
        })
      });
      const data = await resp.json();
      return res.status(200).json({ id: data.id, success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // GET: Retrieve state by ID
  if (req.method === 'GET') {
    const id = req.query.id || req.query.code;
    if (!id) return res.status(400).json({ error: 'Missing code or id' });
    try {
      const resp = await fetch(`https://api.restful-api.dev/objects/${encodeURIComponent(id)}`);
      if (!resp.ok) {
        return res.status(resp.status).json({ error: 'Sync code not found or expired' });
      }
      const data = await resp.json();
      const state = (data && data.data && data.data.state) ? data.data.state : data;
      return res.status(200).json({ state: state, success: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

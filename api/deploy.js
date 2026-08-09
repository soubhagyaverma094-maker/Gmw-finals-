 export const config = { api: { bodyParser: { sizeLimit: '50mb' } } };
 export default async function handler(req, res) {
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
   if (req.method === 'OPTIONS') return res.status(200).end();
   if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
   try {
     const { project, token, files } = req.body || {};
     const vercelToken = process.env.VERCEL_TOKEN || token;
     if (!vercelToken) return res.status(400).json({ error: 'No Vercel token' });
     if (!project || !files) return res.status(400).json({ error: 'Missing project or files' });
     const deployFiles = Object.entries(files).map(([file, content]) => {
       if (content && typeof content === 'object' && content.encoding === 'base64') {
         return { file, data: content.data, encoding: 'base64' };
       }
       return { file, data: content, encoding: 'utf-8' };
     });
     const vres = await fetch('https://api.vercel.com/v13/deployments', {
       method: 'POST',
       headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
       body: JSON.stringify({ name: project, files: deployFiles, projectSettings: { framework: null }, target: 'production' })
     });
     const out = await vres.json();
     if (!vres.ok) return res.status(vres.status).json({ error: out.error?.message || 'Vercel error' });
     return res.status(200).json({ url: out.url, id: out.id, alias: out.alias });
   } catch (err) {
     return res.status(500).json({ error: err.message });
   }
 }

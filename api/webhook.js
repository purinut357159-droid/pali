/**
 * Vercel Serverless Function - LINE OA Webhook Endpoint
 * 
 * ลิงก์ที่ได้เมื่อ Deploy บน Vercel:
 * https://<your-vercel-domain>.vercel.app/api/webhook
 */

export default async function handler(req, res) {
  // CORS & GET Health Check
  if (req.method === 'GET') {
    return res.status(200).send('Pali Tycoon LINE Webhook Serverless API Active!');
  }

  if (req.method === 'POST') {
    const events = req.body?.events || [];
    console.log('Received LINE Webhook Event:', events);

    // ตอบกลับ Status 200 OK สำหรับ LINE Developers Console Verification
    return res.status(200).json({ status: 'ok', eventsCount: events.length });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

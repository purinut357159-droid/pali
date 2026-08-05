/**
 * LINE Official Account (LINE Messaging API) Webhook Handler Template
 * 
 * สำหรับโปรเจกต์ บาลีเศรษฐี (Pali Tycoon)
 * 
 * การใช้งาน:
 * 1. นำไฟล์นี้ไปปรับใช้บน Backend (เช่น Node.js / Express / Vercel Serverless / Railway)
 * 2. ติดตั้ง package: npm install @line/bot-sdk express
 * 3. ตั้งค่า Environment Variables:
 *    - LINE_CHANNEL_ACCESS_TOKEN
 *    - LINE_CHANNEL_SECRET
 */

const express = require('express');
const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'YOUR_CHANNEL_ACCESS_TOKEN',
  channelSecret: process.env.LINE_CHANNEL_SECRET || 'YOUR_CHANNEL_SECRET',
};

const client = new line.Client(config);
const app = express();

// Webhook Endpoint Target URL: https://<YOUR-DOMAIN>/webhook
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userMessage = event.message.text.trim();

  // ตัวอย่างการตอบกลับคำถามบาลีอัตโนมัติผ่าน LINE OA
  if (userMessage === 'สุ่มคำถาม' || userMessage === 'บาลี') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '🎲 คำถามบาลีเศรษฐี:\n\n"พุทฺโธ" แปลว่าอะไร?\n1. ผู้รู้ ผู้ตื่น ผู้เบิกบาน\n2. พระผู้มีพระภาคเจ้า\n3. พระธรรมคำสอน\n\n(พิมพ์คำตอบ 1, 2 หรือ 3 เพื่อตอบ!)',
    });
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: `ยินดีต้อนรับสู่ บาลีเศรษฐี (Pali Tycoon)!\n\nพิมพ์ "บาลี" หรือ "สุ่มคำถาม" เพื่อเริ่มทดสอบความรู้ภาษาบาลีได้เลยครับ 🙏`,
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LINE Webhook Server running on port ${PORT}`);
});

import axios from 'axios';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || 'NGQO5+Hzm4xYanKqb1IY6CHq91ODt4ojsAHk82PAKXfnztP3MkJX3EVfGwcq/2Ot5vkcUB6LDIjK8ZS7yuEDt0wVUHSOiORHCwnw9CgR02tghaSfpGHBfceUpMX7YIYJ3dMKnzMFgpdsffj1qaEMkwdB04t89/1O/w1cDnyilFU=';

const LINE_QUIZ_BANK = [
  {
    id: 'g1',
    category: 'บาลีไวยากรณ์',
    question: 'คำว่า "พุทฺโธ" ในบาลีไวยากรณ์จัดเป็นคำประเภทใด?',
    options: ['1. นามนาม (ปุกลิงค์ เอกวจนะ)', '2. คุณนาม', '3. สัพพนาม', '4. อัพยยศัพท์'],
    correct: 1,
    explanation: 'พุทฺโธ เป็น นามนาม แสดงชื่อบุคคล แจก อ-การันต์ ในปุกลิงค์ ลง สิ ปฐมาวิภัตติ เป็น โอ',
  },
  {
    id: 'g2',
    category: 'บาลีไวยากรณ์ (วิภัตติ)',
    question: 'วิภัตติท้ายศัพท์ "-สฺส" ใน "พุทธสฺส" ทำหน้าที่เป็นวิภัตติใด?',
    options: ['1. จตุตถี หรือ ฉัฏฐีวิภัตติ', '2. ปฐมาวิภัตติ', '3. ตติยาวิภัตติ', '4. สัตตมีวิภัตติ'],
    correct: 1,
    explanation: '-สฺส เป็นวิภัตติของ จตุตถี (แก่/เพื่อ/ต่อ) และ ฉัฏฐี (แห่ง/ของ/เมื่อ)',
  },
];

async function replyLineMessage(replyToken, messages) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) return;

  try {
    await axios.post(
      'https://api.line.me/v2/bot/message/reply',
      {
        replyToken: replyToken,
        messages: Array.isArray(messages) ? messages : [messages],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
        },
      }
    );
  } catch (error) {
    console.error('Error replying to LINE API:', error.response?.data || error.message);
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).send('Pali Tycoon (บาลีส่วนฐี) LINE Webhook API Active!');
  }

  if (req.method === 'POST') {
    const events = req.body?.events || [];

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.trim();
        const replyToken = event.replyToken;

        if (text.includes('บาลี') || text.includes('ไวยากรณ์') || text.includes('สุ่มคำถาม') || text.includes('เริ่มเล่น')) {
          const q = LINE_QUIZ_BANK[Math.floor(Math.random() * LINE_QUIZ_BANK.length)];
          await replyLineMessage(replyToken, {
            type: 'flex',
            altText: `🎲 โจทย์บาลีไวยากรณ์: ${q.question}`,
            contents: {
              type: 'bubble',
              header: {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#162544',
                contents: [{ type: 'text', text: `🎲 โจทย์ [${q.category}]`, weight: 'bold', color: '#f59e0b', size: 'sm' }],
              },
              body: {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#0f172a',
                contents: [
                  { type: 'text', text: q.question, weight: 'bold', size: 'md', wrap: true, color: '#ffffff' },
                  { type: 'separator', margin: 'md', color: '#d4af37' },
                  {
                    type: 'box',
                    layout: 'vertical',
                    margin: 'md',
                    spacing: 'sm',
                    contents: q.options.map((opt, idx) => ({
                      type: 'button',
                      style: 'secondary',
                      height: 'sm',
                      action: { type: 'message', label: opt, text: `ตอบข้อ ${idx + 1}` },
                    })),
                  },
                ],
              },
            },
          });
        } else if (text.startsWith('ตอบข้อ')) {
          const choiceNum = parseInt(text.replace('ตอบข้อ', '').trim());
          if (choiceNum === 1) {
            await replyLineMessage(replyToken, { type: 'text', text: '✨ สาธุ! ตอบถูกต้องตามหลักบาลีไวยากรณ์ครับ 🎉\n\nพิมพ์ "สุ่มคำถาม" เพื่อทำข้อถัดไป!' });
          } else {
            await replyLineMessage(replyToken, { type: 'text', text: '❌ ยังไม่ถูกต้องตามหลักไวยากรณ์ครับ ลองคิดทบทวนดูอีกครั้งนะ!\n\nพิมพ์ "สุ่มคำถาม" เพื่อลองใหม่' });
          }
        } else {
          await replyLineMessage(replyToken, {
            type: 'text',
            text: '🙏 เจริญพร! ยินดีต้อนรับสู่ บาลีส่วนฐี พิมพ์ "สุ่มคำถาม" เพื่อทำข้อสอบบาลีไวยากรณ์ครับ',
          });
        }
      }
    }

    return res.status(200).json({ status: 'ok', eventsCount: events.length });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

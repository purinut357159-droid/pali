import axios from 'axios';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

const LINE_QUIZ_BANK = [
  {
    id: 'q1',
    category: 'ไวยากรณ์',
    question: 'คำว่า "พุทฺโธ" ในภาษาบาลีแปลว่าอะไร?',
    options: ['1. ผู้รู้ ผู้ตื่น ผู้เบิกบาน', '2. พระผู้มีพระภาคเจ้า', '3. พระธรรมคำสอน', '4. ความสงบร่มเย็น'],
    correct: 1,
    explanation: 'พุทฺโธ มาจาก พุธ ธาตุ (ความตรัสรู้/ความตื่น) + ต ปัจจัย แปลว่า ผู้รู้ ผู้ตื่น ผู้เบิกบาน',
  },
  {
    id: 'q2',
    category: 'วิภัตติ',
    question: 'วิภัตติท้ายศัพท์ "-สฺส" ใน "พุทธสฺส" ทำหน้าที่เป็นวิภัตติใด?',
    options: ['1. จตุตถี หรือ ฉัฏฐีวิภัตติ', '2. ปฐมาวิภัตติ', '3. ตติยาวิภัตติ', '4. สัตตมีวิภัตติ'],
    correct: 1,
    explanation: '-สฺส เป็นวิภัตติของ จตุตถี (แก่/เพื่อ/ต่อ) และ ฉัฏฐี (แห่ง/ของ/เมื่อ)',
  },
];

async function replyLineMessage(replyToken, messages) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.log('[LINE Vercel Webhook] Reply Token:', replyToken);
    return;
  }

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

function createQuizFlexMessage(q) {
  return {
    type: 'flex',
    altText: `🎲 โจทย์บาลีเศรษฐี: ${q.question}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#162544',
        contents: [
          {
            type: 'text',
            text: `🎲 โจทย์บาลี [หมวด ${q.category}]`,
            weight: 'bold',
            color: '#f59e0b',
            size: 'sm',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: q.question,
            weight: 'bold',
            size: 'md',
            wrap: true,
            color: '#ffffff',
          },
          {
            type: 'separator',
            margin: 'md',
            color: '#d4af37',
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            spacing: 'sm',
            contents: q.options.map((opt, idx) => ({
              type: 'button',
              style: 'secondary',
              height: 'sm',
              action: {
                type: 'message',
                label: opt,
                text: `ตอบข้อ ${idx + 1}`,
              },
            })),
          },
        ],
        backgroundColor: '#0f172a',
      },
    },
  };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).send('Pali Tycoon LINE Webhook & Auto-Reply Vercel Endpoint Active!');
  }

  if (req.method === 'POST') {
    const events = req.body?.events || [];

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.trim();
        const replyToken = event.replyToken;

        if (text.includes('บาลี') || text.includes('สุ่มคำถาม') || text.includes('เริ่มเล่น')) {
          const q = LINE_QUIZ_BANK[Math.floor(Math.random() * LINE_QUIZ_BANK.length)];
          await replyLineMessage(replyToken, createQuizFlexMessage(q));
        } else if (text.startsWith('ตอบข้อ')) {
          const choiceNum = parseInt(text.replace('ตอบข้อ', '').trim());
          if (choiceNum === 1) {
            await replyLineMessage(replyToken, {
              type: 'text',
              text: '✨ สาธุ! คุณตอบถูกต้องแล้วครับ 🎉\n\nพิมพ์ "สุ่มคำถาม" เพื่อทำข้อถัดไป!',
            });
          } else {
            await replyLineMessage(replyToken, {
              type: 'text',
              text: '❌ ยังไม่ถูกต้องครับ ลองคิดทบทวนดูอีกครั้งนะ!\n\nพิมพ์ "สุ่มคำถาม" เพื่อลองโจทย์ใหม่',
            });
          }
        } else {
          await replyLineMessage(replyToken, {
            type: 'text',
            text: '🙏 เจริญพร! พิมพ์ "สุ่มคำถาม" เพื่อทดสอบโจทย์บาลี หรือพิมพ์ "กฎ" เพื่อดูกติกาเกมบาลีเศรษฐีครับ',
          });
        }
      }
    }

    return res.status(200).json({ status: 'ok', eventsCount: events.length });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

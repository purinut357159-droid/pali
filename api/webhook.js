import axios from 'axios';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
const GITHUB_REPO_URL = 'https://github.com/purinut357159-droid/pali.git';

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

function createWebsiteInfoFlex() {
  return {
    type: 'flex',
    altText: '🎲 บาลีเศรษฐี (Pali Tycoon) - เกมกระดานเรียนรู้ภาษาบาลี',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#162544',
        contents: [
          { type: 'text', text: '🎲 บาลีเศรษฐี (Pali Tycoon)', weight: 'bold', color: '#f59e0b', size: 'lg' },
          { type: 'text', text: 'เกมกระดานพิชิตวิชาบาลีเพื่อเป็นมหาเปรียญ', size: 'xs', color: '#94a3b8' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0f172a',
        spacing: 'md',
        contents: [
          { type: 'text', text: 'เรียนภาษาบาลีสนุกเหมือนเล่นเกมเศรษฐี! ครอบครองวิชา อัปเกรดสำนักเรียน ทบทวนด้วยระบบ Spaced Repetition (SRS)', wrap: true, color: '#e2e8f0', size: 'sm' },
          { type: 'separator', color: '#d4af37' },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'xs',
            contents: [
              { type: 'text', text: '⭐ **จุดเด่นในเว็บของเรา**:', color: '#f59e0b', size: 'xs', weight: 'bold' },
              { type: 'text', text: '• กระดาน 40 ช่อง ครอบคลุม 9 หมวดวิชาบาลี', color: '#cbd5e1', size: 'xs' },
              { type: 'text', text: '• ระบบ AI เล่นสู้ และรองรับเล่นได้หลายคน (Pass & Play)', color: '#cbd5e1', size: 'xs' },
              { type: 'text', text: '• สมุดทบทวนข้อผิดพลาดระบบ SRS ทบทวนซ้ำอัตโนมัติ', color: '#cbd5e1', size: 'xs' },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#162544',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#d4af37',
            action: { type: 'uri', label: '🌐 เข้าเล่นบนเว็บไซต์ (GitHub)', uri: GITHUB_REPO_URL },
          },
        ],
      },
    },
  };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).send('Pali Tycoon LINE Webhook Website Info API Active!');
  }

  if (req.method === 'POST') {
    const events = req.body?.events || [];

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const text = event.message.text.trim();
        const replyToken = event.replyToken;

        if (text.includes('เว็บ') || text.includes('เกี่ยวกับ') || text.includes('เกม') || text.includes('บาลีเศรษฐี')) {
          await replyLineMessage(replyToken, createWebsiteInfoFlex());
        } else if (text.includes('ตัวละคร') || text.includes('อาชีพ') || text.includes('สกิล')) {
          await replyLineMessage(replyToken, {
            type: 'text',
            text: '👥 อาชีพในเกมบาลีเศรษฐี:\n\n1. 🧘‍♂️ พระภิกษุ (สกิล: เมตตาธรรม - โบนัสแต้มปัญญาเริ่มต้น +500)\n2. 👦 สามเณร (สกิล: ขยันเรียน - คูณ EXP x1.5 เมื่อผ่านจุดเริ่มต้น)\n3. 👨‍🏫 อาจารย์บาลี (สกิล: รอบรู้ตำรา - ตอบข้อสอบง่ายได้แต้ม x2)\n4. 🎓 นักเรียนบาลี (สกิล: ท่องจำเก่ง - ตอบผิดครั้งแรกฟรี ไม่เสียแต้ม)',
          });
        } else if (text.includes('บาลี') || text.includes('สุ่มคำถาม') || text.includes('เริ่มเล่น')) {
          const q = LINE_QUIZ_BANK[Math.floor(Math.random() * LINE_QUIZ_BANK.length)];
          await replyLineMessage(replyToken, {
            type: 'text',
            text: `🎲 โจทย์บาลี [หมวด ${q.category}]:\n\n${q.question}\n\n${q.options.join('\n')}\n\n(พิมพ์ "ตอบข้อ 1" เพื่อส่งคำตอบ)`,
          });
        } else if (text.startsWith('ตอบข้อ')) {
          const choiceNum = parseInt(text.replace('ตอบข้อ', '').trim());
          if (choiceNum === 1) {
            await replyLineMessage(replyToken, { type: 'text', text: '✨ สาธุ! คุณตอบถูกต้องแล้วครับ 🎉\n\nพิมพ์ "สุ่มคำถาม" เพื่อทำข้อถัดไป!' });
          } else {
            await replyLineMessage(replyToken, { type: 'text', text: '❌ ยังไม่ถูกต้องครับ ลองคิดทบทวนดูอีกครั้งนะ!\n\nพิมพ์ "สุ่มคำถาม" เพื่อลองโจทย์ใหม่' });
          }
        } else {
          await replyLineMessage(replyToken, {
            type: 'text',
            text: '🙏 เจริญพร! พิมพ์ "เว็บ" เพื่อดูรายละเอียดเว็บไซต์, "ตัวละคร" เพื่อดูสกิลอาชีพ, หรือ "สุ่มคำถาม" เพื่อทำโจทย์บาลีครับ',
          });
        }
      }
    }

    return res.status(200).json({ status: 'ok', eventsCount: events.length });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

/**
 * LINE Official Account Auto-Reply Engine
 * ข้อมูลระบบเว็บ บาลีเศรษฐี (Pali Tycoon) ครบวงจร
 */

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

const GITHUB_REPO_URL = 'https://github.com/purinut357159-droid/pali.git';
const WEBSITE_DEMO_URL = 'http://localhost:5173/';

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
  {
    id: 'q3',
    category: 'สมาส',
    question: 'คำสมาสว่า "มหานที" (แม่น้ำใหญ่) จัดเป็นสมาสประเภทใด?',
    options: ['1. วิเสสนปุพพบท กัมมธารยสมาส', '2. ตัปปุริสสมาส', '3. พหุพพีหิสมาส', '4. อัพยยีภาวสมาส'],
    correct: 1,
    explanation: 'มหนฺตี นที = มหานที มีบทหน้าเป็นวิเสสนะ จึงเป็น วิเสสนปุพพบท กัมมธารยสมาส',
  },
];

async function replyLineMessage(replyToken, messages) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.log('[LINE Bot Simulator] Reply Token:', replyToken);
    console.log('[LINE Bot Simulator] Payload:', JSON.stringify(messages, null, 2));
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

// 1. Flex Message: แนะนำเว็บ บาลีเศรษฐี
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
          {
            type: 'text',
            text: '🎲 บาลีเศรษฐี (Pali Tycoon)',
            weight: 'bold',
            color: '#f59e0b',
            size: 'lg',
          },
          {
            type: 'text',
            text: 'เกมกระดานพิชิตวิชาบาลีเพื่อเป็นมหาเปรียญ',
            size: 'xs',
            color: '#94a3b8',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0f172a',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            text: 'เปลี่ยนการเรียนภาษาบาลีให้สนุกเหมือนเล่นเกมเศรษฐี! ครอบครองวิชา อัปเกรดสำนักเรียน ทบทวนความรู้ด้วยระบบ Spaced Repetition (SRS)',
            wrap: true,
            color: '#e2e8f0',
            size: 'sm',
          },
          {
            type: 'separator',
            color: '#d4af37',
          },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'xs',
            contents: [
              { type: 'text', text: '⭐ **จุดเด่นในเว็บของเรา**:', color: '#f59e0b', size: 'xs', weight: 'bold' },
              { type: 'text', text: '• กระดาน 40 ช่อง ครอบคลุม 9 หมวดวิชาบาลี', color: '#cbd5e1', size: 'xs' },
              { type: 'text', text: '• ระบบ AI เล่นสู้ และรองรับเล่นได้หลายคน (Pass & Play)', color: '#cbd5e1', size: 'xs' },
              { type: 'text', text: '• สมุดทบทวนข้อผิดพลาดระบบ SRS ทบทวนซ้ำอัตโนมัติ', color: '#cbd5e1', size: 'xs' },
              { type: 'text', text: '• ระบบเสียงบทสวด เอฟเฟกต์ระฆังวัดและเสียงทอยเต๋า', color: '#cbd5e1', size: 'xs' },
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
            action: {
              type: 'uri',
              label: '🌐 เข้าเล่นบนเว็บไซต์ (GitHub)',
              uri: GITHUB_REPO_URL,
            },
          },
          {
            type: 'button',
            style: 'secondary',
            action: {
              type: 'message',
              label: '🎲 สุ่มโจทย์คำถามบาลี',
              text: 'สุ่มคำถาม',
            },
          },
        ],
      },
    },
  };
}

// 2. Flex Message: ข้อมูลตัวละครและอาชีพ
function createCharactersFlex() {
  return {
    type: 'flex',
    altText: '👥 ข้อมูลตัวละครและอาชีพในเกมบาลีเศรษฐี',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#162544',
        contents: [
          { type: 'text', text: '👥 ตัวละครและสกิลประจำอาชีพ', weight: 'bold', color: '#f59e0b', size: 'md' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#0f172a',
        spacing: 'sm',
        contents: [
          { type: 'text', text: '🧘‍♂️ **พระภิกษุ**: สกิล "เมตตาธรรม" (โบนัสแต้มปัญญาเริ่มต้น +500)', color: '#e2e8f0', size: 'xs', wrap: true },
          { type: 'text', text: '👦 **สามเณร**: สกิล "ขยันเรียน" (โบนัส EXP x1.5 ทุกครั้งที่ผ่านจุดเริ่มต้น)', color: '#e2e8f0', size: 'xs', wrap: true },
          { type: 'text', text: '👨‍🏫 **อาจารย์บาลี**: สกิล "รอบรู้ตำรา" (ตอบโจทย์ง่ายได้โบนัสคูณ 2)', color: '#e2e8f0', size: 'xs', wrap: true },
          { type: 'text', text: '🎓 **นักเรียนบาลี**: สกิล "ท่องจำเก่ง" (ตอบผิดครั้งแรกฟรี ไม่เสียแต้ม)', color: '#e2e8f0', size: 'xs', wrap: true },
        ],
      },
    },
  };
}

// ประมวลผลข้อความและส่งตอบกลับ
async function handleLineEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return;
  }

  const text = event.message.text.trim();
  const replyToken = event.replyToken;

  // 1. เกี่ยวกับเว็บ / บาลีเศรษฐี
  if (text.includes('เว็บ') || text.includes('เกี่ยวกับ') || text.includes('เกม') || text.includes('บาลีเศรษฐี')) {
    await replyLineMessage(replyToken, createWebsiteInfoFlex());
    return;
  }

  // 2. ตัวละคร / อาชีพ / สกิล
  if (text.includes('ตัวละคร') || text.includes('อาชีพ') || text.includes('สกิล')) {
    await replyLineMessage(replyToken, createCharactersFlex());
    return;
  }

  // 3. สุ่มคำถาม
  if (text.includes('บาลี') || text.includes('สุ่มคำถาม') || text.includes('เริ่มเล่น') || text.includes('โจทย์')) {
    const q = LINE_QUIZ_BANK[Math.floor(Math.random() * LINE_QUIZ_BANK.length)];
    await replyLineMessage(replyToken, {
      type: 'flex',
      altText: `🎲 โจทย์บาลีเศรษฐี: ${q.question}`,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#162544',
          contents: [{ type: 'text', text: `🎲 โจทย์บาลี [หมวด ${q.category}]`, weight: 'bold', color: '#f59e0b', size: 'sm' }],
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
    return;
  }

  // 4. ตรวจคำตอบ
  if (text.startsWith('ตอบข้อ')) {
    const choiceNum = parseInt(text.replace('ตอบข้อ', '').trim());
    if (choiceNum === 1) {
      await replyLineMessage(replyToken, {
        type: 'text',
        text: '✨ สาธุ! คุณตอบถูกต้องแล้วครับ 🎉\n\nคำอธิบาย: พุทฺโธ มาจาก พุธ ธาตุ (ความตรัสรู้) แปลว่า ผู้รู้ ผู้ตื่น ผู้เบิกบาน\n\nพิมพ์ "สุ่มคำถาม" เพื่อทำข้อถัดไป!',
      });
    } else {
      await replyLineMessage(replyToken, {
        type: 'text',
        text: '❌ ยังไม่ถูกต้องครับ ลองคิดทบทวนดูอีกครั้งนะ!\n\nพิมพ์ "สุ่มคำถาม" เพื่อลองโจทย์ใหม่ครับ',
      });
    }
    return;
  }

  // 5. กฎกติกา
  if (text.includes('กฎ') || text.includes('กติกา') || text.includes('วิธีเล่น')) {
    await replyLineMessage(replyToken, {
      type: 'text',
      text: `🎲 กฎการเล่นเกม บาลีเศรษฐี (Pali Tycoon):\n\n1. ทอยลูกเต๋า 40 ช่องรอบกระดานวิชาบาลี\n2. ต้องเดินครบรอบ 1 ก่อนจึงจะเริ่มซื้อวิชาได้\n3. ตอบคำถามถูกเพื่อซื้อวิชา หรือลดค่าผ่านทาง 50%\n4. ทอยได้เต๋าคู่ (Doubles) ได้สิทธิ์ทอยซ้ำ\n5. ตอบผิดข้อสอบจะถูกบันทึกลง "สมุดทบทวน" ให้ฝึกฝนซ้ำแบบ SRS\n\nดูซอร์สโค้ดและวิธีเล่นได้ที่: ${GITHUB_REPO_URL}`,
    });
    return;
  }

  // 6. เมนูต้อนรับ / Default Help
  await replyLineMessage(replyToken, [
    {
      type: 'text',
      text: '🙏 เจริญพร! ยินดีต้อนรับสู่ LINE Official Account ของ บาลีเศรษฐี (Pali Tycoon Bot)\n\nระบบตอบกลับข้อมูลเว็บไซต์และโจทย์คำถามบาลีอัตโนมัติ!',
    },
    {
      type: 'text',
      text: 'พิมพ์คำเพื่อสอบถามข้อมูลได้เลยครับ:\n• พิมพ์ "เว็บ" ➔ ดูรายละเอียดจุดเด่นของเว็บเรา\n• พิมพ์ "ตัวละคร" ➔ ดูอาชีพและสกิลพิเศษ\n• พิมพ์ "สุ่มคำถาม" ➔ ทำโจทย์บาลีพร้อมเฉลย\n• พิมพ์ "กฎ" ➔ ดูกฎกติกาการเล่นเกม',
    },
  ]);
}

// Endpoints
app.get('/webhook', (req, res) => {
  res.status(200).send('Pali Tycoon LINE Webhook & Website Info Auto-Reply Engine Active!');
});

app.post('/webhook', (req, res) => {
  const events = req.body.events || [];
  events.forEach((event) => {
    handleLineEvent(event).catch(console.error);
  });
  res.status(200).json({ status: 'success', processedEvents: events.length });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Pali Tycoon LINE Auto-Reply Server running on port ${PORT}`);
});

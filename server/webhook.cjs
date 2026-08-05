/**
 * LINE Official Account (LINE Messaging API) Auto-Reply Engine
 * โปรเจกต์: บาลีเศรษฐี (Pali Tycoon)
 */

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

// คลังคำถามสำหรับตอบกลับผ่าน LINE OA
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

// ฟังก์ชั่นส่งข้อความตอบกลับไปยัง LINE Messaging API (Reply Message)
async function replyLineMessage(replyToken, messages) {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.log('[LINE Bot Simulator] Reply Token:', replyToken);
    console.log('[LINE Bot Simulator] Messages:', JSON.stringify(messages, null, 2));
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
    console.log('Successfully sent reply to LINE User!');
  } catch (error) {
    console.error('Error replying to LINE API:', error.response?.data || error.message);
  }
}

// สร้าง Flex Message การ์ดคำถามบาลี
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
      footer: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#162544',
        contents: [
          {
            type: 'text',
            text: 'พิมพ์ "สุ่มคำถาม" เพื่อเปลี่ยนโจทย์ใหม่',
            size: 'xs',
            color: '#94a3b8',
            align: 'center',
          },
        ],
      },
    },
  };
}

// ประมวลผลข้อความและส่งคำตอบกลับ
async function handleLineEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return;
  }

  const text = event.message.text.trim();
  const replyToken = event.replyToken;

  if (text.includes('บาลี') || text.includes('สุ่มคำถาม') || text.includes('เริ่มเล่น') || text.includes('โจทย์')) {
    const q = LINE_QUIZ_BANK[Math.floor(Math.random() * LINE_QUIZ_BANK.length)];
    const flexMsg = createQuizFlexMessage(q);
    await replyLineMessage(replyToken, flexMsg);
    return;
  }

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

  if (text.includes('กฎ') || text.includes('กติกา') || text.includes('วิธีเล่น')) {
    await replyLineMessage(replyToken, {
      type: 'text',
      text: '🎲 กฎการเล่นเกม บาลีเศรษฐี (Pali Tycoon):\n\n1. ทอยลูกเต๋า 40 ช่องรอบกระดานวิชาบาลี\n2. ต้องเดินครบรอบ 1 ก่อนจึงจะเริ่มซื้อวิชาได้\n3. ตอบคำถามถูกเพื่อครอบครองวิชา หรือรับส่วนลดค่าผ่านทาง 50%\n4. ทอยได้เต๋าคู่ (Doubles) จะได้ทอยซ้ำ\n5. เล่นผ่านเว็บได้ที่: https://github.com/purinut357159-droid/pali.git',
    });
    return;
  }

  // Default Greeting / Menu
  await replyLineMessage(replyToken, [
    {
      type: 'text',
      text: '🙏 เจริญพร! ยินดีต้อนรับสู่ LINE Official Account: บาลีเศรษฐี (Pali Tycoon Bot)\n\nระบบตอบกลับอัตโนมัติพร้อมทดสอบความรู้ภาษาบาลีของคุณ!',
    },
    {
      type: 'text',
      text: 'เลือกทำรายการได้เลยครับ:\n• พิมพ์ "สุ่มคำถาม" ➔ ทดสอบโจทย์บาลี\n• พิมพ์ "กฎ" ➔ กติกาการเล่นบาลีเศรษฐี\n• พิมพ์ "วิภัตติ" ➔ ดูเกร็ดความรู้วิภัตติ',
    },
  ]);
}

// Webhook Endpoints
app.get('/webhook', (req, res) => {
  res.status(200).send('Pali Tycoon LINE Webhook & Auto-Reply Engine Active!');
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

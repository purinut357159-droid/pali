import type { CardEffect } from '../types/game';

export const BOON_CARDS: CardEffect[] = [
  {
    id: 'b1',
    title: 'อาจารย์ชม',
    description: 'ได้รับคำชมเชยจากพระอาจารย์ รับโบนัส +150 แต้มปัญญา!',
    type: 'boon',
    wisdomDelta: 150,
  },
  {
    id: 'b2',
    title: 'ตอบถูกติดกัน',
    description: 'จิตใจผ่องใส เกิดปัญญาว่องไว เดินหน้าเพิ่มอีก 2 ช่อง!',
    type: 'boon',
    moveDelta: 2,
  },
  {
    id: 'b3',
    title: 'ได้หนังสือใหม่',
    description: 'ค้นพบคัมภีร์ใบลานทรงคุณค่า รับโบนัส +200 แต้มปัญญา!',
    type: 'boon',
    wisdomDelta: 200,
  },
  {
    id: 'b4',
    title: 'ได้ครูติวพิเศษ',
    description: 'ได้รับการอบรมจากมหาเปรียญ ได้รับไพ่ "ตอบฟรี 1 ข้อ"!',
    type: 'boon',
    giveFreeAnswerCard: true,
  },
  {
    id: 'b5',
    title: 'พระอาจารย์เมตตา',
    description: 'ได้รับพรจากพระอาจารย์ใหญ่ รับโบนัส +300 แต้มปัญญา!',
    type: 'boon',
    wisdomDelta: 300,
  },
];

export const KARMA_CARDS: CardEffect[] = [
  {
    id: 'k1',
    title: 'ลืมบทท่องจำ',
    description: 'เผลอสติลืมบทท่องไวยากรณ์ เสียแต้มปัญญา -100 แต้ม',
    type: 'karma',
    wisdomDelta: -100,
  },
  {
    id: 'k2',
    title: 'ติดสอบซ่อม',
    description: 'ต้องทบทวนตำราเพิ่มเติม ข้ามการเล่น 1 ตา!',
    type: 'karma',
    skipNextTurn: true,
  },
  {
    id: 'k3',
    title: 'หนังสือหาย',
    description: 'ต้องจัดหาคัมภีร์ชุดใหม่ เสียแต้มปัญญา -150 แต้ม',
    type: 'karma',
    wisdomDelta: -150,
  },
  {
    id: 'k4',
    title: 'เดินย้อนกลับ',
    description: 'จำเส้นทางสำนักเรียนผิด ถอยหลัง 2 ช่อง!',
    type: 'karma',
    moveDelta: -2,
  },
  {
    id: 'k5',
    title: 'สับสนวิภัตติ',
    description: 'สับสนแจกแจงรูปศัพท์ เสียแต้มปัญญา -200 แต้ม',
    type: 'karma',
    wisdomDelta: -200,
  },
];

import type { BoardTile } from '../types/game';

export interface ComboInfo {
  hasCombo: boolean;
  multiplier: number;
  reasons: string[];
}

export const UPGRADE_NAMES = [
  'ตำรา (Base)',
  'ห้องเรียน',
  'สำนักเรียน',
  'สนามสอบ',
  'มหาวิทยาลัยบาลี',
];

/**
 * ตรวจสอบคอมโบของวิชา/บ้าน:
 * 1. มีวิชาในหมวดเดียวกันครบ 4 หลัง หรือครอบครองครบทั้งหมวด
 * 2. มีสิ่งปลูกสร้างระดับเดียวกัน (เช่น ห้องเรียน, สำนักเรียน) ครบ 4 หลังขึ้นไป
 */
export function checkPropertyCombo(
  tiles: BoardTile[],
  targetTile: BoardTile,
  ownerId?: string | null
): ComboInfo {
  if (!targetTile || targetTile.type !== 'subject' || !ownerId) {
    return { hasCombo: false, multiplier: 1, reasons: [] };
  }

  const reasons: string[] = [];
  let multiplier = 1;

  // 1. ตรวจสอบคอมโบหมวดวิชาเดียวกัน (Category / Color Group)
  if (targetTile.category) {
    const categoryTiles = tiles.filter((t) => t.category === targetTile.category);
    const ownedInCategory = categoryTiles.filter((t) => t.ownerId === ownerId);

    if (ownedInCategory.length >= 4) {
      multiplier = 2;
      reasons.push(`ครอบครองวิชาหมวด "${targetTile.category}" ครบ ${ownedInCategory.length} หลัง`);
    } else if (categoryTiles.length > 0 && ownedInCategory.length === categoryTiles.length) {
      multiplier = 2;
      reasons.push(`ครอบครองวิชาหมวด "${targetTile.category}" ครบเซ็ต (${ownedInCategory.length}/${categoryTiles.length} วิชา)`);
    }
  }

  // 2. ตรวจสอบคอมโบบ้านระดับเดียวกันครบ 4 หลัง (Same Upgrade Level)
  const targetLevel = targetTile.upgradeLevel ?? 0;
  const levelName = UPGRADE_NAMES[targetLevel] || `ระดับ ${targetLevel}`;
  const ownedWithSameLevel = tiles.filter(
    (t) => t.type === 'subject' && t.ownerId === ownerId && (t.upgradeLevel ?? 0) === targetLevel
  );

  if (ownedWithSameLevel.length >= 4) {
    multiplier = 2;
    reasons.push(`มีสิ่งปลูกสร้างระดับ "${levelName}" ชนิดเดียวกันครบ ${ownedWithSameLevel.length} หลัง`);
  }

  return {
    hasCombo: multiplier > 1,
    multiplier: Math.max(1, multiplier),
    reasons,
  };
}

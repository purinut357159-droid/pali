import type { Question, ReviewItem } from '../types/game';

export function addWrongQuestionToSRS(existingItems: ReviewItem[], question: Question): ReviewItem[] {
  const existingIndex = existingItems.findIndex((item) => item.question.id === question.id);
  const nowStr = new Date().toISOString();

  if (existingIndex >= 0) {
    const updated = [...existingItems];
    const current = updated[existingIndex];
    updated[existingIndex] = {
      ...current,
      timesWrong: current.timesWrong + 1,
      lastAnsweredDate: nowStr,
      nextReviewDate: getNextReviewDate(current.timesWrong + 1),
      mastered: false,
    };
    return updated;
  } else {
    const newItem: ReviewItem = {
      question,
      timesWrong: 1,
      lastAnsweredDate: nowStr,
      nextReviewDate: getNextReviewDate(1),
      mastered: false,
    };
    return [newItem, ...existingItems];
  }
}

export function markQuestionMastered(existingItems: ReviewItem[], questionId: string): ReviewItem[] {
  return existingItems.map((item) => {
    if (item.question.id === questionId) {
      return { ...item, mastered: true };
    }
    return item;
  });
}

function getNextReviewDate(timesWrong: number): string {
  const date = new Date();
  const addDays = timesWrong === 1 ? 1 : timesWrong === 2 ? 3 : 7;
  date.setDate(date.getDate() + addDays);
  return date.toISOString();
}

export function getTodayDueReviews(items: ReviewItem[]): ReviewItem[] {
  return items.filter((item) => !item.mastered);
}

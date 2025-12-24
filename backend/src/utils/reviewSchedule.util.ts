export const LEITNER_INTERVALS = [
  1000 * 60 * 60 * 24, // 1 day
  1000 * 60 * 60 * 24 * 3, // 3 days
  1000 * 60 * 60 * 24 * 7, // 1 week
  1000 * 60 * 60 * 24 * 14, // 2 weeks
  1000 * 60 * 60 * 24 * 30, // 1 month
];

export function calculateNextReview(box: number): Date {
  const safe = Math.min(Math.max(1, box), 5);
  return new Date(Date.now() + LEITNER_INTERVALS[safe - 1]);
}

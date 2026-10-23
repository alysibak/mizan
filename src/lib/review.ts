// Whether a named scholar has reviewed Mizan's rulings. Set by whoever runs
// the site once a review has really happened; never assumed.
//
//   REVIEWED_BY  "Shaykh Name, Institution"
//   REVIEWED_ON  "2026-11-01"

export interface Review {
  by: string;
  on: string;
}

export function scholarReview(): Review | null {
  const by = process.env.REVIEWED_BY?.trim();
  const on = process.env.REVIEWED_ON?.trim();
  return by && on && /^\d{4}-\d{2}-\d{2}$/.test(on) ? { by, on } : null;
}

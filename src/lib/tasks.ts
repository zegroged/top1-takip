// Admin'in müşteriye hızlıca ekleyebileceği tipik servis/tamir iş kalemleri.
// Sıra önerisidir; admin istediği gibi düzenler.
export const TASK_SUGGESTIONS: string[] = [
  "Araç Teslim Alındı / Kayıt",
  "Ekspertiz / Arıza Tespiti",
  "Parça Siparişi",
  "Parça Temin Edildi",
  "Söküm",
  "Montaj / Parça Değişimi",
  "Ayar & Kalibrasyon",
  "Test & Yol Denemesi",
  "Yıkama / Temizlik",
  "Teslim",
];

type TaskLike = { done: boolean };

export function computeProgress(tasks: TaskLike[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.done).length;
  return Math.round((done / tasks.length) * 100);
}

export function countDone(tasks: TaskLike[]): number {
  return tasks.filter((t) => t.done).length;
}

// Servis/tamir takip aşamaları. Müşteri, aracının onarım sürecini bu adımlarla görür.
// Customer.currentStage ve ProgressUpdate.stage bu key'leri kullanır.

export type Stage = {
  key: string;
  label: string;
  description: string;
};

export const STAGES: Stage[] = [
  { key: "alindi", label: "Araç Teslim Alındı", description: "Aracınız servise alındı, kayıt açıldı." },
  { key: "tespit", label: "Arıza Tespiti", description: "Ekspertiz yapıldı, arıza ve gereken parçalar belirlendi." },
  { key: "parca", label: "Parça Temin Edildi", description: "Gerekli yedek parçalar tedarik edildi." },
  { key: "montaj", label: "Montaj / İşçilik", description: "Parçalar takılıyor, onarım sürüyor." },
  { key: "test", label: "Test & Kontrol", description: "Onarım sonrası kontrol ve yol testi yapılıyor." },
  { key: "teslim", label: "Teslime Hazır / Teslim", description: "Aracınız hazır ve teslim edildi." },
];

export const STAGE_KEYS = STAGES.map((s) => s.key);

export function stageIndex(key: string): number {
  return STAGES.findIndex((s) => s.key === key);
}

export function getStage(key: string): Stage | undefined {
  return STAGES.find((s) => s.key === key);
}

export function stageLabel(key: string): string {
  return getStage(key)?.label ?? key;
}

export function isStageDone(currentKey: string, stageKey: string): boolean {
  return stageIndex(currentKey) > stageIndex(stageKey);
}

export function isStageCurrent(currentKey: string, stageKey: string): boolean {
  return currentKey === stageKey;
}

// İlerleme yüzdesi (0-100)
export function stageProgress(currentKey: string): number {
  const idx = stageIndex(currentKey);
  if (idx < 0) return 0;
  return Math.round((idx / (STAGES.length - 1)) * 100);
}

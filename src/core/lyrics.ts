export type LyricLine = { time: number; text: string };
export function parseLrc(source: string): LyricLine[] {
  const offset =
    Number(source.match(/\[offset:([+-]?\d+)\]/i)?.[1] || 0) / 1000;
  const result: LyricLine[] = [];
  for (const raw of source.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const tags = [...raw.matchAll(/\[(\d{1,3}):([0-5]\d)(?:\.(\d{1,3}))?\]/g)];
    const text = raw.replace(/\[[^\]]*\]/g, "").trim();
    for (const tag of tags)
      result.push({
        time: Math.max(
          0,
          Number(tag[1]) * 60 +
            Number(tag[2]) +
            Number(`0.${tag[3] || "0"}`) +
            offset,
        ),
        text,
      });
  }
  return result.sort((a, b) => a.time - b.time);
}
export function activeLyric(lines: LyricLine[], position: number): number {
  let lo = 0,
    hi = lines.length - 1,
    found = -1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (lines[mid]!.time <= position) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found;
}
export function timestamp(time: number): string {
  const hundredths = Math.max(0, Math.round(time * 100));
  return `[${String(Math.floor(hundredths / 6000)).padStart(2, "0")}:${String(Math.floor(hundredths / 100) % 60).padStart(2, "0")}.${String(hundredths % 100).padStart(2, "0")}]`;
}
export function serializeLrc(lines: LyricLine[]): string {
  return [...lines]
    .sort((a, b) => a.time - b.time)
    .map((line) => timestamp(line.time) + line.text)
    .join("\n");
}

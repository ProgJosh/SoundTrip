const paths = {
  file: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.6-4.6",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  check: "M5 12.5l4.5 4.5L19 7.5",
  shuffle:
    "M3 7h3.5c4 0 7 10 11 10H21M3 17h3.5c1.6 0 2.9-1.6 4-3.6M14 9.6C15 8 16.1 7 17.5 7H21M18 4l3 3-3 3M18 14l3 3-3 3",
  repeat:
    "M4 11V9a3 3 0 0 1 3-3h13M17 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H4M7 21l-3-3 3-3",
  prev: "M5 5h2.5v14H5zM19 5L9 12l10 7z",
  next: "M16.5 5H19v14h-2.5zM5 5l10 7-10 7z",
  plane:
    "M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z",
  music:
    "M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  device:
    "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2",
  lock: "M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11",
  open: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
};

export type IconName = keyof typeof paths;

export function Icon({
  name,
  size = 32,
  color = "currentColor",
  stroke = 2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  stroke?: number;
}) {
  const filled = name === "plane" || name === "prev" || name === "next";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={color}
      strokeWidth={filled ? 0 : stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d={paths[name]} />
    </svg>
  );
}

export function PlayPause({
  playing,
  size = 44,
  color,
}: {
  playing: boolean;
  size?: number;
  color: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      {playing ? (
        <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
      ) : (
        <path d="M8 5v14l11-7z" />
      )}
    </svg>
  );
}

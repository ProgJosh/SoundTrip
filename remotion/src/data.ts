// Fictional demo content. Song and artist names are invented for the video.
export const playlists = [
  { name: "Late night drive", songs: 62 },
  { name: "Sunday reset", songs: 38 },
  { name: "Gym, 2023", songs: 74 },
  { name: "Road trip ’24", songs: 51 },
  { name: "Rainy commute", songs: 29 },
];

export const totalSongs = playlists.reduce((n, p) => n + p.songs, 0);

export const matches = [
  {
    title: "Neon Harbor",
    artist: "The Tidelines",
    file: "The Tidelines - Neon Harbor.flac",
    exact: true,
  },
  {
    title: "Slow Static",
    artist: "Mara Vell",
    file: "Slow Static.mp3",
    exact: true,
  },
  {
    title: "Afterglow - Remastered 2011",
    artist: "Juno Park",
    file: "Juno Park - Afterglow.mp3",
    exact: false,
  },
  {
    title: "Paper Planes Home",
    artist: "Okto",
    file: "Paper Planes Home.m4a",
    exact: true,
  },
];

// "Late night drive": 58 of 62 songs get a confirmed file.
export const matched = 58;

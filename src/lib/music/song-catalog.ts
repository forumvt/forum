import type { MusicSong } from "@/types/music";

/** Catálogo demo com vídeos YouTube embutíveis (MVP). */
export const DEMO_SONG_CATALOG: MusicSong[] = [
  {
    id: "yt-get-lucky",
    title: "Get Lucky",
    artist: "Daft Punk",
    thumbnail: "https://i.ytimg.com/vi/5NV6Rdv1a3I/hqdefault.jpg",
    duration: 248,
    source: "youtube",
    externalId: "5NV6Rdv1a3I",
  },
  {
    id: "yt-one-more-time",
    title: "One More Time",
    artist: "Daft Punk",
    thumbnail: "https://i.ytimg.com/vi/FHCGBn7FOLs/hqdefault.jpg",
    duration: 320,
    source: "youtube",
    externalId: "FHCGBn7FOLs",
  },
  {
    id: "yt-numb",
    title: "Numb",
    artist: "Linkin Park",
    thumbnail: "https://i.ytimg.com/vi/kXYiU_JCYtU/hqdefault.jpg",
    duration: 187,
    source: "youtube",
    externalId: "kXYiU_JCYtU",
  },
  {
    id: "yt-in-the-end",
    title: "In the End",
    artist: "Linkin Park",
    thumbnail: "https://i.ytimg.com/vi/eVTXPUF4Oz4/hqdefault.jpg",
    duration: 216,
    source: "youtube",
    externalId: "eVTXPUF4Oz4",
  },
  {
    id: "yt-blinding-lights",
    title: "Blinding Lights",
    artist: "The Weeknd",
    thumbnail: "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg",
    duration: 200,
    source: "youtube",
    externalId: "4NRXx6U8ABQ",
  },
  {
    id: "yt-levitating",
    title: "Levitating",
    artist: "Dua Lipa",
    thumbnail: "https://i.ytimg.com/vi/TUVcZfQe-Kw/hqdefault.jpg",
    duration: 203,
    source: "youtube",
    externalId: "TUVcZfQe-Kw",
  },
  {
    id: "yt-as-it-was",
    title: "As It Was",
    artist: "Harry Styles",
    thumbnail: "https://i.ytimg.com/vi/H5v3kku4y6Q/hqdefault.jpg",
    duration: 167,
    source: "youtube",
    externalId: "H5v3kku4y6Q",
  },
  {
    id: "yt-bad-guy",
    title: "bad guy",
    artist: "Billie Eilish",
    thumbnail: "https://i.ytimg.com/vi/DyDfgMOUjCI/hqdefault.jpg",
    duration: 194,
    source: "youtube",
    externalId: "DyDfgMOUjCI",
  },
];

export function findSongById(songId: string): MusicSong | undefined {
  return DEMO_SONG_CATALOG.find((song) => song.id === songId);
}

export function pickRandomSong(excludeId?: string | null): MusicSong {
  const pool = excludeId
    ? DEMO_SONG_CATALOG.filter((song) => song.id !== excludeId)
    : DEMO_SONG_CATALOG;
  const list = pool.length > 0 ? pool : DEMO_SONG_CATALOG;
  return list[Math.floor(Math.random() * list.length)]!;
}

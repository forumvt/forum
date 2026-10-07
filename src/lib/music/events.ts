import { MUSIC_REALTIME_EVENTS } from "@/types/music";

export { MUSIC_REALTIME_EVENTS };

export function isMusicRealtimeEventType(
  value: string,
): value is (typeof MUSIC_REALTIME_EVENTS)[keyof typeof MUSIC_REALTIME_EVENTS] {
  return (Object.values(MUSIC_REALTIME_EVENTS) as string[]).includes(value);
}

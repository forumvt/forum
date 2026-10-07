import { MusicRoom } from "@/components/music/music-room";

export const metadata = {
  title: "Sala musical | VT Forums",
  description: "Sala musical ao vivo.",
};

type Props = { params: Promise<{ roomId: string }> };

export default async function MusicRoomPage({ params }: Props) {
  const { roomId } = await params;
  return <MusicRoom roomId={roomId} />;
}

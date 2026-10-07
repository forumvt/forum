import Link from "next/link";

import { MusicRoomList } from "@/components/music/music-room-list";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export const metadata = {
  title: "Music | VT Forums",
  description: "Salas musicais ao vivo do fórum.",
};

export default function MusicPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-4xl px-4 pt-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={"/" as never}>Início</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Music</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <MusicRoomList />
    </>
  );
}

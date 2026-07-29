import Link from "next/link";

import { forumTable } from "@/db/schema";
import { cn } from "@/lib/utils";

interface ForumItemProps {
  forum: typeof forumTable.$inferSelect;
  textContainerClassName?: string;
  color: "teal" | "purple" | "orange";
}

const ForumItem = ({
  forum,
  textContainerClassName,
  color,
}: ForumItemProps) => {
  // Apenas a cor da borda identifica a categoria; o hover usa o token do tema
  // para não quebrar no dark mode.
  const colorClasses =
    color === "teal"
      ? "border-teal-500"
      : color === "purple"
        ? "border-purple-500"
        : "border-orange-500";

  return (
    <Link
      href={`/forums/${forum.slug}`}
      className={cn(
        "hover:bg-muted focus-visible:ring-ring flex min-w-0 flex-col gap-2 rounded-lg border p-4 transition-colors outline-none focus-visible:ring-[3px]",
        colorClasses,
      )}
    >
      <div className={cn("flex flex-col gap-1", textContainerClassName)}>
        <p className="truncate text-base font-semibold hover:underline">
          {forum.title}
        </p>
        <p className="text-muted-foreground truncate text-sm">
          {forum.description}
        </p>
      </div>

      <div className="text-muted-foreground flex justify-between text-xs">
        <span>Threads: 0</span>
        <span>Posts: 0</span>
      </div>

      <div className="text-muted-foreground text-xs">
        Última: — {/* Aqui depois dá pra puxar last user/post */}
      </div>
    </Link>
  );
};

export default ForumItem;

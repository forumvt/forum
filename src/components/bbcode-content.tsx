import type { CSSProperties } from "react";

import {
  type BBCodeNode,
  isBlockNode,
  parseBBCode,
} from "@/utils/bbcode-parser";

function hasBlockChild(nodes: BBCodeNode[]): boolean {
  return nodes.some(isBlockNode);
}

function groupNodes(
  nodes: BBCodeNode[],
): Array<
  { kind: "inline"; nodes: BBCodeNode[] } | { kind: "block"; node: BBCodeNode }
> {
  const groups: Array<
    | { kind: "inline"; nodes: BBCodeNode[] }
    | { kind: "block"; node: BBCodeNode }
  > = [];

  for (const node of nodes) {
    if (isBlockNode(node)) {
      groups.push({ kind: "block", node });
    } else {
      const last = groups[groups.length - 1];
      if (last?.kind === "inline") {
        last.nodes.push(node);
      } else {
        groups.push({ kind: "inline", nodes: [node] });
      }
    }
  }

  return groups;
}

function InlineNodes({
  nodes,
  compact,
}: {
  nodes: BBCodeNode[];
  compact?: boolean;
}) {
  return (
    <>
      {nodes.map((node, index) => (
        <BBCodeNodeView key={index} node={node} compact={compact} />
      ))}
    </>
  );
}

function NodeChildren({
  nodes,
  compact,
}: {
  nodes: BBCodeNode[];
  compact?: boolean;
}) {
  const groups = groupNodes(nodes);

  return (
    <>
      {groups.map((group, index) => {
        if (group.kind === "block") {
          return (
            <BBCodeNodeView
              key={index}
              node={group.node}
              compact={compact}
            />
          );
        }
        const onlyWhitespace = group.nodes.every(
          (n) => n.type === "text" && n.content.trim() === "",
        );
        if (onlyWhitespace) return null;
        return (
          <p
            key={index}
            className="text-foreground break-words whitespace-pre-wrap"
          >
            <InlineNodes nodes={group.nodes} compact={compact} />
          </p>
        );
      })}
    </>
  );
}

function InlineWrap({
  node,
  className,
  style,
  as: Tag = "span",
  compact,
}: {
  node: Extract<BBCodeNode, { children: BBCodeNode[] }>;
  className?: string;
  style?: CSSProperties;
  as?: "span" | "strong" | "em" | "u" | "s" | "div";
  compact?: boolean;
}) {
  if (hasBlockChild(node.children)) {
    return (
      <div className={className} style={style}>
        <NodeChildren nodes={node.children} compact={compact} />
      </div>
    );
  }

  return (
    <Tag className={className} style={style}>
      <InlineNodes nodes={node.children} compact={compact} />
    </Tag>
  );
}

function BBCodeNodeView({
  node,
  compact,
}: {
  node: BBCodeNode;
  compact?: boolean;
}) {
  switch (node.type) {
    case "text":
      return <>{node.content}</>;
    case "bold":
      return (
        <InlineWrap
          node={node}
          as="strong"
          className="font-bold"
          compact={compact}
        />
      );
    case "italic":
      return (
        <InlineWrap
          node={node}
          as="em"
          className="italic"
          compact={compact}
        />
      );
    case "underline":
      return (
        <InlineWrap
          node={node}
          as="u"
          className="underline"
          compact={compact}
        />
      );
    case "strike":
      return (
        <InlineWrap
          node={node}
          as="s"
          className="line-through"
          compact={compact}
        />
      );
    case "url":
      if (!node.href) {
        return <InlineWrap node={node} compact={compact} />;
      }
      if (hasBlockChild(node.children)) {
        return (
          <div>
            <NodeChildren nodes={node.children} compact={compact} />
          </div>
        );
      }
      return (
        <a
          href={node.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary break-all underline-offset-2 hover:underline"
        >
          <InlineNodes nodes={node.children} compact={compact} />
        </a>
      );
    case "color":
      return (
        <InlineWrap
          node={node}
          style={node.color ? { color: node.color } : undefined}
          compact={compact}
        />
      );
    case "size":
      return (
        <InlineWrap
          node={node}
          style={node.size ? { fontSize: `${node.size}px` } : undefined}
          compact={compact}
        />
      );
    case "code":
      return (
        <pre className="border-border bg-muted overflow-x-auto rounded-md border p-3 text-sm">
          <code className="font-mono whitespace-pre-wrap">{node.content}</code>
        </pre>
      );
    case "list": {
      const ListTag = node.ordered ? "ol" : "ul";
      return (
        <ListTag
          className={
            node.ordered
              ? "text-foreground list-decimal space-y-1 pl-6"
              : "text-foreground list-disc space-y-1 pl-6"
          }
        >
          {node.items.map((item, index) => (
            <li key={index} className="break-words">
              {hasBlockChild(item) ? (
                <NodeChildren nodes={item} compact={compact} />
              ) : (
                <InlineNodes nodes={item} compact={compact} />
              )}
            </li>
          ))}
        </ListTag>
      );
    }
    case "spoiler":
      return (
        <details className="border-border bg-muted/40 rounded-md border p-3">
          <summary className="text-foreground cursor-pointer font-medium">
            Spoiler
          </summary>
          <div className="mt-2 space-y-2">
            <NodeChildren nodes={node.children} compact={compact} />
          </div>
        </details>
      );
    case "center":
      return (
        <div className="space-y-2 text-center">
          <NodeChildren nodes={node.children} compact={compact} />
        </div>
      );
    case "quote":
      return (
        <div className="border-border my-2 overflow-hidden rounded-md border bg-muted/50">
          <div className="bg-accent text-accent-foreground px-4 py-1.5 font-bold">
            {node.username ? `${node.username}:` : "Quote:"}
          </div>
          <div className="text-muted-foreground space-y-2 p-4 pt-2 break-words">
            <NodeChildren nodes={node.children} compact={compact} />
          </div>
        </div>
      );
    case "image":
      return (
        <div
          className={
            compact
              ? "border-border inline-block overflow-hidden rounded border"
              : "border-border overflow-hidden rounded-lg border shadow-md"
          }
        >
          <img
            src={node.url}
            alt="Imagem anexada"
            className={
              compact
                ? "h-auto max-h-[350px] w-auto max-w-[500px] object-contain"
                : "h-auto w-full object-contain"
            }
          />
        </div>
      );
    case "youtube":
      return (
        <div className="border-border aspect-video overflow-hidden rounded-lg border shadow-md">
          <iframe
            src={`https://www.youtube.com/embed/${node.id}`}
            title="Vídeo do YouTube"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      );
    case "twitter":
      return (
        <div className="border-border bg-muted rounded-lg border p-4 shadow-md">
          <div className="mb-2 flex items-center gap-2">
            <div className="bg-foreground flex h-4 w-4 items-center justify-center rounded-sm">
              <span className="text-background text-xs font-bold">𝕏</span>
            </div>
            <span className="text-muted-foreground text-sm">
              Tweet incorporado
            </span>
          </div>
          <a
            href={node.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-sm hover:underline"
          >
            Ver tweet original →
          </a>
        </div>
      );
    default:
      return null;
  }
}

export function BBCodeContent({
  content,
  compact,
}: {
  content: string;
  compact?: boolean;
}) {
  const nodes = parseBBCode(content);

  if (nodes.length === 0) {
    return null;
  }

  return (
    <div className="min-w-0 space-y-3">
      <NodeChildren nodes={nodes} compact={compact} />
    </div>
  );
}

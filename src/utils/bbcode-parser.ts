export type BBCodeNode =
  | { type: "text"; content: string }
  | { type: "bold"; children: BBCodeNode[] }
  | { type: "italic"; children: BBCodeNode[] }
  | { type: "underline"; children: BBCodeNode[] }
  | { type: "strike"; children: BBCodeNode[] }
  | { type: "url"; href: string | null; children: BBCodeNode[] }
  | { type: "color"; color: string | null; children: BBCodeNode[] }
  | { type: "size"; size: number | null; children: BBCodeNode[] }
  | { type: "code"; content: string }
  | { type: "list"; ordered: boolean; items: BBCodeNode[][] }
  | { type: "spoiler"; children: BBCodeNode[] }
  | { type: "center"; children: BBCodeNode[] }
  | { type: "quote"; username?: string; children: BBCodeNode[] }
  | { type: "image"; url: string }
  | { type: "youtube"; id: string }
  | { type: "twitter"; id: string; url: string };

const NAMED_COLORS = new Set([
  "black",
  "white",
  "red",
  "green",
  "blue",
  "yellow",
  "orange",
  "purple",
  "pink",
  "gray",
  "grey",
  "brown",
  "navy",
  "teal",
  "cyan",
  "magenta",
  "lime",
  "maroon",
  "olive",
  "silver",
  "aqua",
  "fuchsia",
  "gold",
  "indigo",
  "violet",
  "coral",
  "tomato",
  "crimson",
  "darkred",
  "darkblue",
  "darkgreen",
]);

const CONTAINER_TAGS = new Set([
  "b",
  "i",
  "u",
  "s",
  "url",
  "color",
  "size",
  "spoiler",
  "center",
  "quote",
  "list",
]);

const RAW_TAGS = new Set(["code", "img", "youtube", "twitter"]);

interface MatchedTag {
  close: boolean;
  name: string;
  attr?: string;
  length: number;
}

export function parseBBCode(content: string): BBCodeNode[] {
  if (!content) return [];
  const { nodes } = parseUntil(content, 0, null, new Set());
  return nodes;
}

export function stripBBCode(text: string): string {
  return text
    .replace(/\[\/?[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isBlockNode(node: BBCodeNode): boolean {
  return (
    node.type === "quote" ||
    node.type === "list" ||
    node.type === "image" ||
    node.type === "youtube" ||
    node.type === "twitter" ||
    node.type === "code" ||
    node.type === "center" ||
    node.type === "spoiler"
  );
}

export function sanitizeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return trimmed;
  } catch {
    return null;
  }
}

export function sanitizeColor(value: string): string | null {
  const trimmed = value.trim();
  if (NAMED_COLORS.has(trimmed.toLowerCase())) {
    return trimmed.toLowerCase();
  }
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function sanitizeSize(value: string): number | null {
  const n = Number.parseInt(value.trim(), 10);
  if (Number.isNaN(n)) return null;
  return Math.min(28, Math.max(10, n));
}

function matchTag(input: string, pos: number): MatchedTag | null {
  if (input[pos] !== "[") return null;
  const end = input.indexOf("]", pos);
  if (end === -1) return null;

  const inner = input.slice(pos + 1, end);
  if (!inner) return null;

  const close = inner.startsWith("/");
  const body = close ? inner.slice(1) : inner;
  if (body === "*") {
    return { close, name: "*", length: end - pos + 1 };
  }

  const eq = body.indexOf("=");
  const name = (eq === -1 ? body : body.slice(0, eq)).trim().toLowerCase();
  if (!/^[a-z]+$/.test(name)) return null;
  const attr = eq === -1 ? undefined : body.slice(eq + 1);

  return { close, name, attr, length: end - pos + 1 };
}

function findRawClose(
  input: string,
  start: number,
  tagName: string,
): { contentEnd: number; after: number } {
  const lower = input.slice(start).toLowerCase();
  const needle = `[/${tagName}]`;
  const idx = lower.indexOf(needle);
  if (idx === -1) {
    return { contentEnd: input.length, after: input.length };
  }
  return { contentEnd: start + idx, after: start + idx + needle.length };
}

function parseUntil(
  input: string,
  start: number,
  stopTag: string | null,
  ancestors: Set<string>,
): { nodes: BBCodeNode[]; pos: number } {
  const nodes: BBCodeNode[] = [];
  let pos = start;
  let textStart = start;

  const flushText = (end: number) => {
    if (end > textStart) {
      nodes.push({ type: "text", content: input.slice(textStart, end) });
    }
  };

  while (pos < input.length) {
    if (input[pos] !== "[") {
      pos += 1;
      continue;
    }

    const tag = matchTag(input, pos);
    if (!tag) {
      pos += 1;
      continue;
    }

    if (tag.close) {
      if (stopTag && tag.name === stopTag) {
        flushText(pos);
        return { nodes, pos: pos + tag.length };
      }
      if (ancestors.has(tag.name)) {
        flushText(pos);
        return { nodes, pos };
      }
      pos += tag.length;
      continue;
    }

    if (tag.name === "*" && stopTag === "*") {
      flushText(pos);
      return { nodes, pos };
    }

    const isKnown = CONTAINER_TAGS.has(tag.name) || RAW_TAGS.has(tag.name);
    if (!isKnown) {
      pos += tag.length;
      continue;
    }

    flushText(pos);
    const parsed = parseOpenTag(input, pos, tag, ancestors);
    nodes.push(parsed.node);
    pos = parsed.pos;
    textStart = pos;
  }

  flushText(input.length);
  return { nodes, pos: input.length };
}

function parseOpenTag(
  input: string,
  pos: number,
  tag: MatchedTag,
  ancestors: Set<string>,
): { node: BBCodeNode; pos: number } {
  const innerStart = pos + tag.length;
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(tag.name);

  switch (tag.name) {
    case "b": {
      const { nodes, pos: end } = parseUntil(
        input,
        innerStart,
        "b",
        nextAncestors,
      );
      return { node: { type: "bold", children: nodes }, pos: end };
    }
    case "i": {
      const { nodes, pos: end } = parseUntil(
        input,
        innerStart,
        "i",
        nextAncestors,
      );
      return { node: { type: "italic", children: nodes }, pos: end };
    }
    case "u": {
      const { nodes, pos: end } = parseUntil(
        input,
        innerStart,
        "u",
        nextAncestors,
      );
      return { node: { type: "underline", children: nodes }, pos: end };
    }
    case "s": {
      const { nodes, pos: end } = parseUntil(
        input,
        innerStart,
        "s",
        nextAncestors,
      );
      return { node: { type: "strike", children: nodes }, pos: end };
    }
    case "spoiler": {
      const { nodes, pos: end } = parseUntil(
        input,
        innerStart,
        "spoiler",
        nextAncestors,
      );
      return { node: { type: "spoiler", children: nodes }, pos: end };
    }
    case "center": {
      const { nodes, pos: end } = parseUntil(
        input,
        innerStart,
        "center",
        nextAncestors,
      );
      return { node: { type: "center", children: nodes }, pos: end };
    }
    case "quote": {
      const { nodes, pos: end } = parseUntil(
        input,
        innerStart,
        "quote",
        nextAncestors,
      );
      const username = tag.attr?.trim() || undefined;
      return { node: { type: "quote", username, children: nodes }, pos: end };
    }
    case "color": {
      const { nodes, pos: end } = parseUntil(
        input,
        innerStart,
        "color",
        nextAncestors,
      );
      return {
        node: {
          type: "color",
          color: tag.attr ? sanitizeColor(tag.attr) : null,
          children: nodes,
        },
        pos: end,
      };
    }
    case "size": {
      const { nodes, pos: end } = parseUntil(
        input,
        innerStart,
        "size",
        nextAncestors,
      );
      return {
        node: {
          type: "size",
          size: tag.attr ? sanitizeSize(tag.attr) : null,
          children: nodes,
        },
        pos: end,
      };
    }
    case "url": {
      if (tag.attr !== undefined) {
        const { nodes, pos: end } = parseUntil(
          input,
          innerStart,
          "url",
          nextAncestors,
        );
        return {
          node: {
            type: "url",
            href: sanitizeUrl(tag.attr),
            children: nodes,
          },
          pos: end,
        };
      }
      const close = findRawClose(input, innerStart, "url");
      const inner = input.slice(innerStart, close.contentEnd).trim();
      return {
        node: {
          type: "url",
          href: sanitizeUrl(inner),
          children: [{ type: "text", content: inner }],
        },
        pos: close.after,
      };
    }
    case "code": {
      const close = findRawClose(input, innerStart, "code");
      return {
        node: {
          type: "code",
          content: input.slice(innerStart, close.contentEnd),
        },
        pos: close.after,
      };
    }
    case "img": {
      const close = findRawClose(input, innerStart, "img");
      const url = input.slice(innerStart, close.contentEnd).trim();
      const safe = sanitizeUrl(url);
      if (!safe) {
        return { node: { type: "text", content: url }, pos: close.after };
      }
      return { node: { type: "image", url: safe }, pos: close.after };
    }
    case "youtube": {
      const close = findRawClose(input, innerStart, "youtube");
      const inner = input.slice(innerStart, close.contentEnd).trim();
      const id = extractYouTubeId(inner);
      if (!id) {
        return { node: { type: "text", content: inner }, pos: close.after };
      }
      return { node: { type: "youtube", id }, pos: close.after };
    }
    case "twitter": {
      const close = findRawClose(input, innerStart, "twitter");
      const inner = input.slice(innerStart, close.contentEnd).trim();
      const id = extractTwitterId(inner);
      if (!id) {
        return { node: { type: "text", content: inner }, pos: close.after };
      }
      const url = inner.startsWith("http")
        ? inner
        : `https://twitter.com/i/status/${id}`;
      return { node: { type: "twitter", id, url }, pos: close.after };
    }
    case "list": {
      return parseList(input, innerStart, tag.attr, nextAncestors);
    }
    default:
      return {
        node: { type: "text", content: input.slice(pos, innerStart) },
        pos: innerStart,
      };
  }
}

function parseList(
  input: string,
  innerStart: number,
  attr: string | undefined,
  ancestors: Set<string>,
): { node: BBCodeNode; pos: number } {
  const ordered = Boolean(attr && attr.trim() !== "");
  const items: BBCodeNode[][] = [];
  let pos = innerStart;

  while (pos < input.length) {
    while (pos < input.length && /\s/.test(input[pos] ?? "")) {
      pos += 1;
    }

    const tag = matchTag(input, pos);
    if (tag?.close && tag.name === "list") {
      return {
        node: { type: "list", ordered, items },
        pos: pos + tag.length,
      };
    }
    if (tag?.close && ancestors.has(tag.name) && tag.name !== "list") {
      return { node: { type: "list", ordered, items }, pos };
    }
    if (tag && !tag.close && tag.name === "*") {
      pos += tag.length;
      const { nodes, pos: itemEnd } = parseUntil(input, pos, "*", ancestors);
      items.push(nodes);
      pos = itemEnd;
      continue;
    }
    if (!tag) {
      pos += 1;
      continue;
    }
    pos += tag.length;
  }

  return { node: { type: "list", ordered, items }, pos };
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function extractTwitterId(url: string): string | null {
  const patterns = [
    /twitter\.com\/\w+\/status\/(\d+)/,
    /x\.com\/\w+\/status\/(\d+)/,
    /^(\d+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

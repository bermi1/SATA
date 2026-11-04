import type { ReactNode } from "react";

// Renders the simple article markup used by news posts:
// "## heading", "- bullet", "1. numbered", **bold**, blank line between paragraphs.
const inline = (s: string): ReactNode[] =>
  s.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith("**") ? <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong> : part));

export function RichText({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    if (line.startsWith("## ")) { blocks.push(<h2 key={i} className="mb-3 mt-9 font-display text-xl font-bold text-deep">{line.slice(3)}</h2>); i++; continue; }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) items.push(lines[i++].trim().slice(2));
      blocks.push(<ul key={i} className="my-4 space-y-2 pl-1">{items.map((t, k) => <li key={k} className="flex gap-3"><span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-blue" /><span>{inline(t)}</span></li>)}</ul>);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) items.push(lines[i++].trim().replace(/^\d+\.\s/, ""));
      blocks.push(<ol key={i} className="my-4 space-y-2">{items.map((t, k) => <li key={k} className="flex gap-3"><span className="w-6 shrink-0 font-display text-sm font-bold text-blue">{k + 1}.</span><span>{inline(t)}</span></li>)}</ol>);
      continue;
    }
    blocks.push(<p key={i} className="my-4">{inline(line)}</p>);
    i++;
  }
  return <div className="text-[17px] leading-[1.75] text-muted">{blocks}</div>;
}

/** First paragraph without markup, for cards. */
export const excerpt = (text: string, max = 190) => {
  const first = text.split("\n").map((l) => l.trim()).find((l) => l && !l.startsWith("##") && !l.startsWith("- ") && !/^\d+\./.test(l)) ?? "";
  const plain = first.replace(/\*\*/g, "");
  return plain.length > max ? plain.slice(0, max).replace(/\s+\S*$/, "") + "…" : plain;
};

import { Fragment } from "react";
import { cn } from "@/lib/utils";

const URL_RE = /((?:https?:\/\/|www\.)[^\s]+)/gi;

interface LinkifiedProps {
  text: string;
  className?: string;
}

/** Renders text, turning any URLs it contains into clickable links. */
export function Linkified({ text, className }: LinkifiedProps) {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  URL_RE.lastIndex = 0;
  while ((match = URL_RE.exec(text)) !== null) {
    let url = match[0];
    // Keep trailing punctuation out of the link (e.g. "see http://x.com.").
    const trailing = url.match(/[.,;:!?)\]}'"]+$/)?.[0] ?? "";
    if (trailing) url = url.slice(0, -trailing.length);

    if (match.index > last) nodes.push(text.slice(last, match.index));

    const href = url.startsWith("http") ? url : `https://${url}`;
    nodes.push(
      <a
        key={key++}
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn("break-all underline underline-offset-2", className)}
      >
        {url}
      </a>
    );
    if (trailing) nodes.push(trailing);
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));

  return <>{nodes.map((n, i) => <Fragment key={i}>{n}</Fragment>)}</>;
}

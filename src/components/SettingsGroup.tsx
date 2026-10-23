import type { ReactNode } from "react";

/**
 * One folded part of Settings: its name and where it stands now, opened
 * with a tap. `id` is the address a link opens it from (/settings#id).
 */
export default function SettingsGroup({
  id,
  title,
  now,
  open = false,
  children,
}: {
  id: string;
  title: string;
  /** Where it stands, in a few words, so it can be read without opening. */
  now?: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-20">
      <details open={open} className="group border-b border-mist">
        <summary className="flex min-h-[3.5rem] list-none items-center justify-between gap-4 py-3 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0">
            <span className="block font-serif text-xl text-ink">{title}</span>
            {now ? <span className="block text-sm text-sage nums">{now}</span> : null}
          </span>
          <span aria-hidden className="text-2xl leading-none text-sage transition group-open:rotate-45">
            +
          </span>
        </summary>
        <div className="space-y-6 pb-8 pt-2">{children}</div>
      </details>
    </div>
  );
}

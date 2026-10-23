import Link from "next/link";

const TABS = [
  ["/admin/users", "Accounts"],
  ["/admin/feedback", "What people said"],
] as const;

/** The two admin pages, side by side. */
export default function AdminTabs({ current }: { current: (typeof TABS)[number][0] }) {
  return (
    <nav aria-label="Admin" className="flex gap-5 border-b border-mist text-base">
      {TABS.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={href === current ? "page" : undefined}
          className={
            "-mb-px inline-flex min-h-[2.75rem] items-center border-b-2 " +
            (href === current ? "border-pine font-medium text-ink" : "border-transparent text-sage hover:text-pine")
          }
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

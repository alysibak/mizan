// Small, dependency-free stroke icons. They inherit color from the parent via
// currentColor, so a single text color drives both icon and label.
import type { ReactNode, SVGProps } from "react";

function Glyph({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

type P = { className?: string };

export const IconBalance = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <circle cx="12" cy="4" r="1" />
    <path d="M12 5v13" />
    <path d="M8.5 20h7" />
    <path d="M5 8h14" />
    <path d="M6 8v2M18 8v2" />
    <path d="M3.8 10a2.2 2.2 0 0 0 4.4 0" />
    <path d="M15.8 10a2.2 2.2 0 0 0 4.4 0" />
  </Glyph>
);

export const IconAssets = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <rect x="3" y="6" width="18" height="12" rx="2.5" />
    <path d="M3 10h18" />
    <circle cx="16.5" cy="14" r="1.1" />
  </Glyph>
);

export const IconZakat = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <circle cx="9" cy="10" r="4" />
    <circle cx="15" cy="15" r="4" />
  </Glyph>
);

export const IconGiving = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M12 21C12 21 4 13.7 4 8.8 4 6.1 6.1 4 8.8 4c1.6 0 3 .8 3.9 2 .9-1.2 2.3-2 3.9-2 2.7 0 4.8 2.1 4.8 4.8C20.4 13.7 12 21 12 21z" />
  </Glyph>
);

export const IconScreening = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z" />
    <path d="M9 11.8l2 2 4-4" />
  </Glyph>
);

export const IconSettings = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M4 7h16M4 12h16M4 17h16" />
    <circle cx="9" cy="7" r="2" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
    <circle cx="9" cy="17" r="2" fill="currentColor" stroke="none" />
  </Glyph>
);

export const IconSignOut = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M15 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" />
    <path d="M10 12h10" />
    <path d="M17 9l3 3-3 3" />
  </Glyph>
);

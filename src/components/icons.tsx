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

export const IconGlobe = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
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

export const IconUsers = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 19c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M14.2 19c.4-1.8 1.9-3.2 3.8-3.5" />
  </Glyph>
);

export const IconStatement = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M7 3.5h7.5L19 8v12.5H7z" />
    <path d="M14.5 3.5V8H19" />
    <path d="M10 12h6M10 15.5h6M10 19h3.5" />
  </Glyph>
);

export const IconMirath = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7.5v3.5" />
    <path d="M6 15V11h12v4" />
    <circle cx="6" cy="18" r="2" />
    <circle cx="12" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
  </Glyph>
);

export const IconYear = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <rect x="4" y="5" width="16" height="15" rx="1.5" />
    <path d="M4 9.5h16" />
    <path d="M8 3.5v3M16 3.5v3" />
    <path d="M8 13.5h2M12 13.5h2M16 13.5h0.5M8 17h2M12 17h2" />
  </Glyph>
);

export const IconTools = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M14.5 4.5l5 5-8.2 8.2a3.2 3.2 0 0 1-4.5-4.5L14.5 4.5z" />
    <path d="M12.5 6.5l5 5" />
    <path d="M4 20l3.2-1.1" />
  </Glyph>
);

export const IconLedger = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M6 4h10.5L19 6.5V20H6z" />
    <path d="M16.5 4v2.5H19" />
    <path d="M9 10h7M9 13.5h7M9 17h4" />
  </Glyph>
);

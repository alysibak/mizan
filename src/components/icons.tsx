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

export const IconSpeaker = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M15.5 9a4 4 0 0 1 0 6" />
    <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Glyph>
);

/** Pictures for the walk-through's steps, so each question is known at a glance. */
export const IconCoins = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <ellipse cx="9" cy="7" rx="5.5" ry="2.5" />
    <path d="M3.5 7v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V7" />
    <path d="M9.5 16.4c.9 1.2 3.1 2.1 5.5 2.1 3 0 5.5-1.1 5.5-2.5v-4c0-1.3-2.2-2.4-5-2.5" />
  </Glyph>
);

export const IconCash = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <rect x="2.5" y="6" width="19" height="12" rx="1.5" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M6 9.5v5M18 9.5v5" />
  </Glyph>
);

export const IconBank = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M3 9.5 12 4l9 5.5" />
    <path d="M4.5 10v8M9.5 10v8M14.5 10v8M19.5 10v8" />
    <path d="M3 20h18" />
  </Glyph>
);

export const IconGoldBar = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M6.5 9h11l3 8h-17z" />
    <path d="M9 9l1-3h4l1 3" />
  </Glyph>
);

export const IconRing = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <circle cx="12" cy="14.5" r="5.5" />
    <path d="M9.5 9.5 8 6.5l2-2.5h4l2 2.5-1.5 3" />
  </Glyph>
);

export const IconChart = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M4 4v16h16" />
    <path d="m7 15 4-4 3 3 5-6" />
  </Glyph>
);

export const IconReceipt = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </Glyph>
);

export const IconCheckCircle = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.5 2.7 2.7L16.5 9" />
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

export const IconQuestion = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.8" />
    <path d="M12 17h.01" />
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

/** Pictures for "what counts" and "what does not". */
export const IconHome = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M3.5 11.5 12 4l8.5 7.5" />
    <path d="M6 9.8V20h12V9.8" />
    <path d="M10 20v-5h4v5" />
  </Glyph>
);

export const IconCar = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M3.5 16.5V12l2.2-5h12.6l2.2 5v4.5z" />
    <path d="M3.5 12h17" />
    <circle cx="7.5" cy="17" r="2" />
    <circle cx="16.5" cy="17" r="2" />
  </Glyph>
);

export const IconPhone = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <rect x="7" y="3" width="10" height="18" rx="2" />
    <path d="M11 18h2" />
  </Glyph>
);

export const IconShop = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M4 9l1.5-5h13L20 9" />
    <path d="M4 9c0 1.4 1.2 2.5 2.7 2.5S9.3 10.4 9.3 9c0 1.4 1.2 2.5 2.7 2.5s2.7-1.1 2.7-2.5c0 1.4 1.2 2.5 2.6 2.5S20 10.4 20 9" />
    <path d="M5.5 11.5V20h13v-8.5" />
    <path d="M10 20v-4.5h4V20" />
  </Glyph>
);

/** Money coming back to you: a coin and a returning arrow. */
export const IconOwed = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <circle cx="15" cy="8.5" r="4.5" />
    <path d="M15 6.5v4" />
    <path d="M19 17H6" />
    <path d="M9 14l-3 3 3 3" />
  </Glyph>
);

/** Pictures for the eight groups who receive zakat (Quran 9:60). */
export const IconBowl = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z" />
    <path d="M9 19.5h6" />
  </Glyph>
);

export const IconOpenHand = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M3 14.5h3.5l3 2.5h5a1.5 1.5 0 0 0 0-3h-3" />
    <path d="M14 14l4.6-2.6a1.6 1.6 0 0 1 2 2.4L15.5 19H9l-3-2" />
    <circle cx="13.5" cy="6.5" r="2.5" />
  </Glyph>
);

export const IconCollector = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <rect x="5.5" y="4.5" width="13" height="16" rx="1.5" />
    <path d="M9.5 3.5h5v2.5h-5z" />
    <path d="M8.5 11l2 2 4-4" />
    <path d="M8.5 16.5h7" />
  </Glyph>
);

export const IconHeart = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" />
    <path d="M9.5 12.5l2 2 3-3.5" />
  </Glyph>
);

export const IconBrokenChain = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M9.5 14.5l-2.8 2.8a2.5 2.5 0 0 1-3.5-3.5l2.8-2.8a2.5 2.5 0 0 1 3.5 0" />
    <path d="M14.5 9.5l2.8-2.8a2.5 2.5 0 0 1 3.5 3.5l-2.8 2.8a2.5 2.5 0 0 1-3.5 0" />
    <path d="M10 4v2.5M4 10h2.5M14 20v-2.5M20 14h-2.5" />
  </Glyph>
);

export const IconDome = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M5 20v-6.5a7 7 0 0 1 14 0V20" />
    <path d="M3.5 20h17" />
    <path d="M12 6.5V3.5" />
    <path d="M10 20v-4a2 2 0 0 1 4 0v4" />
  </Glyph>
);

export const IconTraveller = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <circle cx="11" cy="4.5" r="1.8" />
    <path d="M10.5 8.5 8.5 14l3 2.5 1 4.5" />
    <path d="M10.5 8.5l3 3 2.5.5" />
    <path d="M8.5 14 6.5 20.5" />
    <path d="M17 9.5v11" />
  </Glyph>
);

/** Pictures for single answers ("Do I pay zakat on…?", "Can I give zakat to…?"). */
export const IconGem = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M7 4.5h10l4 5L12 20 3 9.5z" />
    <path d="M3 9.5h18" />
    <path d="M9.5 4.5 12 9.5l2.5-5" />
    <path d="M8 9.5l4 10.5 4-10.5" />
  </Glyph>
);

export const IconLand = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M2.5 19.5 8 12l4 5 3-3.5 6.5 6z" />
    <path d="M15 11V4.5l4.5 1.7L15 8" />
  </Glyph>
);

export const IconKey = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <circle cx="7.5" cy="12" r="3.5" />
    <path d="M11 12h10M18 12v3M15 12v2" />
  </Glyph>
);

export const IconCrypto = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M12 3l7.5 4.5v9L12 21l-7.5-4.5v-9z" />
    <path d="M10 8v8M10 8h2.8a2 2 0 0 1 0 4H10m0 0h3.3a2 2 0 0 1 0 4H10" />
  </Glyph>
);

export const IconJar = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M8 3.5h8" />
    <path d="M9 3.5V6c-2 1-3 2.6-3 4.5V18a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7.5C18 8.6 17 7 15 6V3.5" />
    <circle cx="12" cy="14" r="2.5" />
  </Glyph>
);

export const IconHourglass = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M6.5 3.5h11M6.5 20.5h11" />
    <path d="M8 3.5c0 4 4 5 4 8.5s-4 4.5-4 8.5M16 3.5c0 4-4 5-4 8.5s4 4.5 4 8.5" />
  </Glyph>
);

export const IconBook = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M3.5 5.5c2.5-1 5.5-1 8.5.8 3-1.8 6-1.8 8.5-.8V19c-2.5-1-5.5-1-8.5.8-3-1.8-6-1.8-8.5-.8z" />
    <path d="M12 6.3v13.5" />
  </Glyph>
);

export const IconChild = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <circle cx="8" cy="6" r="2.5" />
    <path d="M3.5 20c0-3.6 2-6.5 4.5-6.5s4.5 2.9 4.5 6.5" />
    <circle cx="16.5" cy="10.5" r="1.8" />
    <path d="M13.5 20c0-2.6 1.3-4.6 3-4.6s3 2 3 4.6" />
  </Glyph>
);

export const IconStar = ({ className = "h-6 w-6" }: P) => (
  <Glyph className={className}>
    <path d="M12 3.5l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.5l-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />
  </Glyph>
);

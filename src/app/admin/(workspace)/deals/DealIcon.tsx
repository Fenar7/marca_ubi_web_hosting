import type { ReactNode, SVGProps } from "react";

export type DealIconName =
  | "calendar"
  | "person"
  | "more"
  | "arrow"
  | "copy"
  | "phone"
  | "message"
  | "close"
  | "check"
  | "search"
  | "chevronLeft"
  | "chevronRight"
  | "grip"
  | "stage";

/** A small shared stroke vocabulary gives operational controls consistent meaning and weight. */
export function DealIcon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: DealIconName }) {
  const paths: Record<DealIconName, ReactNode> = {
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M7 3v4M17 3v4M3 11h18M7 15h3" />
      </>
    ),
    person: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14M14 7l5 5-5 5" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M15 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
      </>
    ),
    phone: (
      <path d="M7 3H4a1 1 0 0 0-1 1 17 17 0 0 0 17 17 1 1 0 0 0 1-1v-3l-5-2-2 2a12 12 0 0 1-7-7l2-2-2-5Z" />
    ),
    message: <path d="M21 11a9 9 0 0 1-13 8l-5 2 1-5a9 9 0 1 1 17-5Z" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    search: (
      <>
        <circle cx="10" cy="10" r="7" />
        <path d="m15 15 6 6" />
      </>
    ),
    chevronLeft: <path d="m14 6-6 6 6 6" />,
    chevronRight: <path d="m10 6 6 6-6 6" />,
    grip: (
      <>
        <path
          d="M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01"
          strokeWidth="3"
        />
      </>
    ),
    stage: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="4" />
        <path d="M9 4v16M15 4v9" />
      </>
    ),
  };
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

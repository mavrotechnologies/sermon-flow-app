/**
 * Shared icon set for the marketing site and the dashboard. All icons are 24×24, 1.6px stroke,
 * currentColor — matching the calm, low-contrast line weight of the type.
 */

type IconProps = { className?: string };

const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor' as const,
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Svg({ className = 'h-[22px] w-[22px]', children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      {children}
    </svg>
  );
}

export function WaveformIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 12h1.5M20.5 12H22" />
      <path d="M7 8.5v7M11 5v14M15 7.5v9M18.5 10v4" />
    </Svg>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 6.6C10.4 5.3 8.2 4.7 5.2 4.7a.7.7 0 0 0-.7.7v11.4c0 .4.3.7.7.7 3 0 5.2.6 6.8 1.9 1.6-1.3 3.8-1.9 6.8-1.9a.7.7 0 0 0 .7-.7V5.4a.7.7 0 0 0-.7-.7c-3 0-5.2.6-6.8 1.9Z" />
      <path d="M12 7v11.4" />
    </Svg>
  );
}

export function NotesIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3.8h9.2L19 7.6V20a.8.8 0 0 1-.8.8H6a.8.8 0 0 1-.8-.8V4.6A.8.8 0 0 1 6 3.8Z" />
      <path d="M14.8 4v3.8H18.6" />
      <path d="M8.4 12.2h7M8.4 15.6h4.6" />
    </Svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20.2 11.6a8.2 8.2 0 0 1-12.1 7.2L3.8 20.2l1.4-4.3A8.2 8.2 0 1 1 20.2 11.6Z" />
      <path d="M9.2 9c-.5.6-.5 1.6.2 2.6a7.4 7.4 0 0 0 2.9 2.6c1 .4 1.9.5 2.4 0" />
    </Svg>
  );
}

export function ScreenIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4.6" width="18" height="12" rx="1.4" />
      <path d="M9.5 20h5M12 16.6V20" />
      <path d="M7.6 9.6h6M7.6 12.4h3.6" />
    </Svg>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="9.2" y="3" width="5.6" height="10" rx="2.8" />
      <path d="M5.6 11.4a6.4 6.4 0 0 0 12.8 0M12 17.8V21M9 21h6" />
    </Svg>
  );
}

export function ArchiveIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.4" y="4.4" width="17.2" height="4.2" rx="1" />
      <path d="M5 8.6v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-10" />
      <path d="M10 12.4h4" />
    </Svg>
  );
}

/** Clock with a rewind hand — for session history / past activity. */
export function HistoryIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.6 11.2a8.4 8.4 0 1 1 2.6 6.6" />
      <path d="M3.4 20v-4.4h4.4" />
      <path d="M12 7.6V12l3.2 1.9" />
    </Svg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13.2 3 5.6 13.4h4.8L10.2 21l7.6-10.4H13L13.2 3Z" />
    </Svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.2 5.4 5.6v5.6c0 4 2.7 7.5 6.6 8.8 3.9-1.3 6.6-4.8 6.6-8.8V5.6L12 3.2Z" />
      <path d="M9.4 11.8l1.9 1.9 3.5-3.5" />
    </Svg>
  );
}

export function CheckIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" {...stroke} strokeWidth={2}>
      <path d="M4.5 10.5l3.4 3.4 7.6-7.8" />
    </svg>
  );
}

export function ArrowRightIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" {...stroke} strokeWidth={1.8}>
      <path d="M4 10h11M10.5 5.5 15 10l-4.5 4.5" />
    </svg>
  );
}

/* ---- Dashboard icons ---- */

export function TrashIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.4 7.2h15.2M9.4 7.2V5a.8.8 0 0 1 .8-.8h3.6a.8.8 0 0 1 .8.8v2.2" />
      <path d="M6.2 7.2 7 19.4a.8.8 0 0 0 .8.8h8.4a.8.8 0 0 0 .8-.8l.8-12.2M10.4 11v5.4M13.6 11v5.4" />
    </Svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20.2 4.4v4.2H16" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5.2v13.6M5.2 12h13.6" />
    </Svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="9" y="9" width="11" height="11" rx="1.4" />
      <path d="M15.6 9V5.4a.8.8 0 0 0-.8-.8H4.8a.8.8 0 0 0-.8.8v10a.8.8 0 0 0 .8.8H9" />
    </Svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 9.4v4M12 16.4h.01" />
      <path d="M10.6 4.5 3.3 17.2A1.6 1.6 0 0 0 4.7 19.6h14.6a1.6 1.6 0 0 0 1.4-2.4L13.4 4.5a1.6 1.6 0 0 0-2.8 0Z" />
    </Svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M11 5.4H6a1.6 1.6 0 0 0-1.6 1.6v11A1.6 1.6 0 0 0 6 19.6h11a1.6 1.6 0 0 0 1.6-1.6v-5" />
      <path d="M16.6 4a1.7 1.7 0 0 1 2.4 2.4l-7.2 7.2H9v-2.8L16.6 4Z" />
    </Svg>
  );
}

export function ChevronLeftIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" {...stroke} strokeWidth={2}>
      <path d="M12.5 4.5 7 10l5.5 5.5" />
    </svg>
  );
}

export function ChevronRightIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" {...stroke} strokeWidth={2}>
      <path d="M7.5 4.5 13 10l-5.5 5.5" />
    </svg>
  );
}

export function ChevronDownIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" {...stroke} strokeWidth={2}>
      <path d="M4.5 7.5 10 13l5.5-5.5" />
    </svg>
  );
}

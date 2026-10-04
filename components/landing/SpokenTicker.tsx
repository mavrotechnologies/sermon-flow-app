import { ArrowRightIcon } from '@/components/ui/icons';

/** What the preacher says, and the reference it resolves to. */
const PAIRS = [
  { spoken: 'second Timothy three sixteen', reference: '2 Timothy 3:16' },
  { spoken: 'John three sixteen', reference: 'John 3:16' },
  { spoken: 'first Corinthians thirteen, verse four', reference: '1 Corinthians 13:4' },
  { spoken: 'Philippians four thirteen', reference: 'Philippians 4:13' },
  { spoken: 'Hebrews eleven, verse one', reference: 'Hebrews 11:1' },
  { spoken: 'Genesis chapter one, verse one', reference: 'Genesis 1:1' },
];

/**
 * A slow, endless row of spoken-phrase → reference chips under the hero
 * preview. Sits on parchment, so it sets its own ink colours rather than
 * inheriting the hero band's.
 */
export function SpokenTicker() {
  return (
    <div>
      <p className="eyebrow mb-4 text-center text-ink-muted">Heard the way it&rsquo;s actually said</p>
      <div className="marquee">
        <div className="marquee-track">
          <Chips />
          {/* Second copy makes the loop seamless; hidden from assistive tech */}
          <Chips hidden />
        </div>
      </div>
    </div>
  );
}

function Chips({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 gap-3 pr-3 motion-reduce:shrink motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:pr-0"
    >
      {PAIRS.map((pair) => (
        <li
          key={pair.reference}
          className="flex shrink-0 items-center gap-2.5 rounded-full border border-line bg-paper px-4 py-2 text-[0.8125rem] whitespace-nowrap shadow-soft"
        >
          <span className="text-ink-muted">&ldquo;{pair.spoken}&rdquo;</span>
          <ArrowRightIcon className="h-3.5 w-3.5 text-amber" />
          <span className="font-semibold text-ink">{pair.reference}</span>
        </li>
      ))}
    </ul>
  );
}

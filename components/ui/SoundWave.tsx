interface SoundWaveProps {
  bars?: number;
  /** Mic open but nobody speaking — the bars settle low and slow. */
  idle?: boolean;
  /** Colour comes from `text-*`; size from `h-*`, `gap-*` and `[&>span]:w-*`. */
  className?: string;
}

/** Stagger, in seconds, so neighbouring bars never move in step. */
const DELAYS = [0, 0.12, 0.24, 0.36, 0.48, 0.3, 0.18, 0.42, 0.06];

/** Animated audio bars. Purely decorative — pair it with a text status. */
export function SoundWave({ bars = 5, idle = false, className = '' }: SoundWaveProps) {
  return (
    <span aria-hidden="true" className={`sound-wave ${idle ? 'sound-wave-idle' : ''} ${className}`}>
      {Array.from({ length: bars }, (_, index) => (
        <span key={index} style={{ animationDelay: `${DELAYS[index % DELAYS.length]}s` }} />
      ))}
    </span>
  );
}

interface AmbientGlowProps {
  /** Adds the fine dot grid — for full-width bands, not small cards. */
  grid?: boolean;
  className?: string;
}

/**
 * Decorative light for a `.band-deep` surface: a soft evergreen bloom in the
 * lower corner, drifting slowly. The parent needs `relative overflow-hidden`,
 * and its content needs `relative` to sit above this.
 */
export function AmbientGlow({ grid = false, className = '' }: AmbientGlowProps) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <span className="glow glow-evergreen right-[-6%] -bottom-56 h-[34rem] w-[34rem]" />
      {grid && <span className="dot-grid" />}
    </div>
  );
}

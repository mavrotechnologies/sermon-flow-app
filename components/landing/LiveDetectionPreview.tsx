'use client';

import { useEffect, useState } from 'react';
import { SoundWave } from '@/components/ui/SoundWave';
import { BoltIcon } from '@/components/ui/icons';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * The hero's product visual: a scripted, looping impression of what the
 * dashboard does — spoken words on the left, the detected verse on the right.
 * Illustrative only; it does not call the detection pipeline.
 */

const SCENARIOS = [
  {
    lines: ['Turn with me, if you would, to the twenty-third psalm.', 'The LORD is my shepherd; I shall not want.'],
    cue: 'the twenty-third psalm',
    reference: 'Psalm 23:1',
    verse: 'The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures.',
    translation: 'KJV',
    confidence: 98,
    latency: '0.4s',
  },
  {
    lines: ['Paul puts it plainly in second Timothy three sixteen.', 'All scripture is given by inspiration of God.'],
    cue: 'second Timothy three sixteen',
    reference: '2 Timothy 3:16',
    verse: 'All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction.',
    translation: 'KJV',
    confidence: 99,
    latency: '0.3s',
  },
  {
    lines: ['And we know — Romans chapter eight, verse twenty-eight —', 'that all things work together for good.'],
    cue: 'Romans chapter eight, verse twenty-eight',
    reference: 'Romans 8:28',
    verse: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
    translation: 'KJV',
    confidence: 97,
    latency: '0.5s',
  },
];

const STEPS_PER_SCENARIO = 5;
const STEP_MS = 1300;

export function LiveDetectionPreview() {
  const [tick, setTick] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const id = setInterval(() => setTick((value) => value + 1), STEP_MS);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const scenarioIndex = Math.floor(tick / STEPS_PER_SCENARIO) % SCENARIOS.length;
  const scenario = SCENARIOS[scenarioIndex];
  // Reduced motion: hold on the step where the transcript and verse are both up.
  const step = reducedMotion ? 2 : tick % STEPS_PER_SCENARIO;
  const verseVisible = step >= 2;
  // The caret sits at the end of whichever line was spoken last.
  const lastSpokenLine = Math.min(step, scenario.lines.length - 1);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="relative overflow-hidden rounded-card border border-line bg-paper text-left text-ink-body shadow-deep">
        {/* Card header */}
        <div className="flex items-center justify-between gap-3 border-b border-line bg-paper-raised/70 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="animate-listening-ring absolute h-2.5 w-2.5 rounded-full bg-amber/50" />
              <span className="relative h-2 w-2 rounded-full bg-amber" />
            </span>
            <span className="text-[0.8125rem] font-semibold text-ink">Listening</span>
            <SoundWave idle={verseVisible} className="ml-1 h-4 text-evergreen" />
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide text-ink-muted">
              {scenario.translation}
            </span>
            <span className="tabular hidden items-center gap-1 rounded-full border border-amber/25 bg-amber-soft px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide text-amber sm:inline-flex">
              <BoltIcon className="h-3 w-3" />
              {scenario.latency} to detect
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-[1.05fr_1fr] sm:divide-x sm:divide-line">
          {/* Spoken words */}
          <div className="px-4 py-4 sm:px-6 sm:py-6">
            <p className="eyebrow mb-3 text-ink-muted">What you said</p>
            <div className="min-h-[7.5rem] space-y-2.5 text-[0.9375rem] leading-relaxed sm:text-base">
              {scenario.lines.map((line, index) => (
                <p
                  key={`${scenario.reference}-${index}`}
                  className={`transition-all duration-500 ${
                    step >= index ? 'text-ink-body opacity-100' : 'translate-y-1 opacity-0'
                  }`}
                >
                  {highlightCue(line, index === 0 ? scenario.cue : null)}
                  {index === lastSpokenLine && !reducedMotion && <span className="caret text-evergreen" />}
                </p>
              ))}
            </div>
          </div>

          {/* Detected verse */}
          <div className="border-t border-line bg-paper-raised/40 px-4 py-4 sm:border-t-0 sm:px-6 sm:py-6">
            <p className="eyebrow mb-3 text-ink-muted">On the screen</p>
            <div className="grid min-h-[12.5rem] sm:min-h-[10.5rem]">
              {/* Waiting state, underneath the verse card */}
              <div
                aria-hidden="true"
                className={`flex items-center justify-center gap-2.5 rounded-[0.875rem] border border-dashed border-line-strong text-[0.8125rem] text-ink-muted transition-opacity duration-300 [grid-area:1/1] ${
                  verseVisible ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <SoundWave className="h-3.5 text-ink-muted/70" />
                Listening for a reference…
              </div>

              <div
                // Keyed so the entrance replays for each new verse
                key={scenario.reference}
                className={`band-deep relative overflow-hidden rounded-[0.875rem] p-4 shadow-deep transition-opacity duration-300 [grid-area:1/1] sm:p-5 ${
                  verseVisible ? 'animate-verse-in opacity-100' : 'opacity-0'
                }`}
              >
                <div className="relative">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <p className="font-display text-[1.1875rem] font-semibold text-paper">{scenario.reference}</p>
                    <span className="tabular rounded-full bg-amber-glow/15 px-2 py-0.5 text-[0.6875rem] font-semibold text-amber-glow">
                      {scenario.confidence}%
                    </span>
                  </div>
                  <p className="verse text-[1.0625rem] leading-relaxed text-paper/90">{scenario.verse}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Which example is playing */}
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 sm:px-6">
          <p className="text-[0.75rem] text-ink-muted">A scripted example of a live session</p>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {SCENARIOS.map((item, index) => (
              <span
                key={item.reference}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  index === scenarioIndex ? 'w-5 bg-evergreen' : 'w-1.5 bg-line-strong'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Underlines the spoken phrase that triggered the detection. */
function highlightCue(line: string, cue: string | null) {
  if (!cue) return line;

  const index = line.indexOf(cue);
  if (index === -1) return line;

  return (
    <>
      {line.slice(0, index)}
      <mark className="bg-amber-soft font-medium text-ink decoration-amber/60 decoration-2 underline-offset-4 [text-decoration-line:underline]">
        {cue}
      </mark>
      {line.slice(index + cue.length)}
    </>
  );
}

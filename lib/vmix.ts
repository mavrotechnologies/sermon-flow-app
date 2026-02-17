import type { VmixSettings } from '@/types';

interface VmixResult {
  success: boolean;
  error?: string;
}

/** Strip protocol prefix and trailing port/slash from a host string */
function cleanHost(raw: string): string {
  let h = raw.trim();
  h = h.replace(/^https?:\/\//, '');
  h = h.replace(/\/.*$/, '');
  // Remove port if user included it in the host field (port is a separate setting)
  h = h.replace(/:\d+$/, '');
  return h;
}

function baseUrl(settings: VmixSettings): string {
  return `http://${cleanHost(settings.host)}:${settings.port}/api/`;
}

/** Check if calling vMix will be blocked by mixed-content policy */
export function isMixedContentBlocked(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'https:';
}

/**
 * Set a text field value on a vMix title input.
 * GET /api/?Function=SetText&Input={input}&SelectedName={field}&Value={value}
 */
export async function vmixSetText(
  settings: VmixSettings,
  fieldName: string,
  value: string
): Promise<VmixResult> {
  try {
    const url = new URL(baseUrl(settings));
    url.searchParams.set('Function', 'SetText');
    url.searchParams.set('Input', settings.titleInput);
    url.searchParams.set('SelectedName', fieldName);
    url.searchParams.set('Value', value);
    const res = await fetch(url.toString(), { mode: 'cors' });
    if (!res.ok) return { success: false, error: `vMix returned ${res.status}` };
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * Show the title input as an overlay (with fade-in).
 * GET /api/?Function=OverlayInput{n}In&Input={input}&Duration={ms}
 */
export async function vmixOverlayIn(
  settings: VmixSettings,
  overlayNum: number = 1,
  duration: number = 500
): Promise<VmixResult> {
  try {
    const url = new URL(baseUrl(settings));
    url.searchParams.set('Function', `OverlayInput${overlayNum}In`);
    url.searchParams.set('Input', settings.titleInput);
    url.searchParams.set('Duration', String(duration));
    const res = await fetch(url.toString(), { mode: 'cors' });
    if (!res.ok) return { success: false, error: `vMix returned ${res.status}` };
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * Hide the overlay (with fade-out).
 * GET /api/?Function=OverlayInput{n}Out&Duration={ms}
 */
export async function vmixOverlayOut(
  settings: VmixSettings,
  overlayNum: number = 1,
  duration: number = 500
): Promise<VmixResult> {
  try {
    const url = new URL(baseUrl(settings));
    url.searchParams.set('Function', `OverlayInput${overlayNum}Out`);
    url.searchParams.set('Duration', String(duration));
    const res = await fetch(url.toString(), { mode: 'cors' });
    if (!res.ok) return { success: false, error: `vMix returned ${res.status}` };
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}

/**
 * Test if vMix is reachable. GET /api/ returns XML when connected.
 */
export async function vmixTestConnection(settings: VmixSettings): Promise<VmixResult> {
  try {
    const res = await fetch(baseUrl(settings), {
      mode: 'cors',
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { success: false, error: `vMix returned ${res.status}` };
    const text = await res.text();
    if (!text.includes('vmix')) {
      return { success: false, error: 'Response does not look like vMix' };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Cannot reach vMix' };
  }
}

/**
 * Orchestrator: SetText for reference, SetText for verse text, then OverlayIn.
 */
export async function presentScripture(
  settings: VmixSettings,
  reference: string,
  verseText: string
): Promise<VmixResult> {
  // Set the reference field
  const refResult = await vmixSetText(settings, settings.referenceField, reference);
  if (!refResult.success) return refResult;

  // Set the verse text field
  const textResult = await vmixSetText(settings, settings.verseTextField, verseText);
  if (!textResult.success) return textResult;

  // Show the overlay with fade
  return vmixOverlayIn(settings);
}

/**
 * Hide the overlay with fade.
 */
export async function hideOverlay(settings: VmixSettings): Promise<VmixResult> {
  return vmixOverlayOut(settings);
}

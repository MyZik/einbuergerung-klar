/** Ignore repeated pointer clicks and pointer clicks during the screen transition.
 * Keyboard and assistive-technology activations (detail 0) remain available.
 */
export function acceptsAnswerClick(
  detail: number,
  now: number,
  readyAt: number,
) {
  return detail === 0 || (detail === 1 && now >= readyAt);
}

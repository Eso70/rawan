/** DOM Range uses UTF-16 offsets, including for Arabic and emoji text. */
export function textChange(before: string, after: string) {
  let start = 0;
  let endBefore = before.length;
  let endAfter = after.length;
  while (start < endBefore && start < endAfter && before[start] === after[start]) start++;
  while (endBefore > start && endAfter > start && before[endBefore - 1] === after[endAfter - 1]) {
    endBefore--;
    endAfter--;
  }
  return { start, endBefore, replacement: after.slice(start, endAfter) };
}

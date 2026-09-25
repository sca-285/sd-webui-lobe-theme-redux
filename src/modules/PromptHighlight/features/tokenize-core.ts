/**
 * Prompt syntax highlighting without Shiki.
 *
 * The prompt grammar (grammar.ts) is a flat list of single-line regular
 * expressions, so it needs none of what a TextMate engine is for. Shiki
 * brought its Oniguruma WebAssembly build along to run it: about 710 KB, a
 * third of the whole theme bundle, loaded on every page view.
 *
 * This tokenizer follows the same rules a TextMate engine applies to such a
 * grammar - at each position the pattern whose match starts earliest wins,
 * ties go to the pattern listed first, and a capture's scope overrides the
 * scope of the whole match inside the captured range - and emits the same
 * HTML shape Shiki did (`pre.shiki > code > span.line > span[style]`), so the
 * existing styles keep working.
 */
import { lang } from './grammar';

interface Rule {
  captures?: Record<number, string>;
  name?: string;
  re: RegExp;
}

const RULES: Rule[] = lang.patterns.map((pattern: any) => ({
  captures: pattern.captures
    ? Object.fromEntries(
        Object.entries(pattern.captures).map(([index, capture]: [string, any]) => [
          Number(index),
          capture.name,
        ]),
      )
    : undefined,
  name: pattern.name,
  // `d` gives the start and end of every capture group
  re: new RegExp(pattern.match, 'dg'),
}));

type Segment = [text: string, scope: string | undefined];

/** Split one line into [text, scope] segments. */
export const tokenizeLine = (line: string): Segment[] => {
  const segments: Segment[] = [];
  let pos = 0;
  while (pos < line.length) {
    let best: { match: RegExpExecArray; rule: Rule } | undefined;
    for (const rule of RULES) {
      rule.re.lastIndex = pos;
      const match = rule.re.exec(line);
      if (match && match[0].length > 0 && (!best || match.index < best.match.index)) {
        best = { match, rule };
      }
    }
    if (!best) {
      segments.push([line.slice(pos), undefined]);
      break;
    }
    const { match, rule } = best;
    if (match.index > pos) segments.push([line.slice(pos, match.index), undefined]);
    const start = match.index;
    const end = start + match[0].length;
    if (rule.captures) {
      // scope of every character of the match: capture 0 first, then groups
      const scopes: (string | undefined)[] = Array.from(
        { length: end - start },
        () => rule.captures![0],
      );
      const indices = (match as any).indices as [number, number][];
      for (const [group, scope] of Object.entries(rule.captures)) {
        const range = indices[Number(group)];
        if (Number(group) === 0 || !range) continue;
        for (let index = range[0]; index < range[1]; index++) scopes[index - start] = scope;
      }
      let runStart = 0;
      for (let index = 1; index <= scopes.length; index++) {
        if (index === scopes.length || scopes[index] !== scopes[runStart]) {
          segments.push([line.slice(start + runStart, start + index), scopes[runStart]]);
          runStart = index;
        }
      }
    } else {
      segments.push([match[0], rule.name]);
    }
    pos = end;
  }
  return segments;
};

export const escapeHtml = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

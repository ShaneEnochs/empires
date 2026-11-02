import { selectInline, substitute } from './interpolate';
import type { Variables } from './types';
export interface TextPart { readonly text?: string; readonly tag?: 'b' | 'i'; readonly children?: readonly TextPart[]; }
/** Parse author markup before substitution so inserted values stay text. */
export function formattedParts(source: string): readonly TextPart[] {
  const root: TextPart[] = []; const stack: { tag: string; children: TextPart[] }[] = [{ tag: '', children: root }];
  for (const piece of source.split(/(\[\/?[bi]\])/g)) {
    if (/^\[[bi]\]$/.test(piece)) {
      const children: TextPart[] = []; const tag = piece[1] as 'b' | 'i';
      stack.at(-1)!.children.push({ tag, children }); stack.push({ tag, children });
    } else if (/^\[\/[bi]\]$/.test(piece)) {
      if (stack.length === 1 || stack.pop()!.tag !== piece[2]) throw new Error('Unbalanced narrative formatting.');
    } else stack.at(-1)!.children.push({ text: piece });
  }
  if (stack.length !== 1) throw new Error('Unclosed narrative formatting.');
  return root;
}
export function renderNarrative(source: string, variables: Variables): DocumentFragment {
  const fragment = document.createDocumentFragment();
  function append(parent: Node, parts: readonly TextPart[]): void {
    for (const part of parts) {
      if (part.text !== undefined) parent.appendChild(document.createTextNode(substitute(part.text, variables)));
      else { const element = document.createElement(part.tag === 'b' ? 'strong' : 'em'); append(element, part.children!); parent.appendChild(element); }
    }
  }
  append(fragment, formattedParts(selectInline(source, variables))); return fragment;
}

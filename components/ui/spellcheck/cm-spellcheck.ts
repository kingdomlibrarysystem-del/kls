/**
 * CodeMirror 6 extensions that make spelling visible in the md-editor-rt
 * input:
 *
 *  1. `spellcheckContentAttributes(locale)` — CodeMirror hard-codes
 *     `spellcheck="false" autocorrect="off"` on `.cm-content` on every
 *     update, which is why a hand-rolled MutationObserver never sticks.
 *     Appending a `EditorView.contentAttributes` facet wins, so the
 *     browser's native dictionary draws real red squiggles.
 *  2. `cmSpellDecorations` — an offline-dictionary-backed wavy underline
 *     decoration (`.kcs-spell-error`) for words our bundle flags, drawn
 *     even when the user agent has no reasonable dictionary for the text.
 */

import { EditorView, Decoration, type DecorationSet } from '@codemirror/view'
import { RangeSetBuilder, StateEffect, StateField, type Extension } from '@codemirror/state'

export const setSpellMisspellings = StateEffect.define<Array<{ from: number; to: number }>>()

const spellMark = Decoration.mark({ class: 'kcs-spell-error' })

const spellDecorations = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes)
    for (const effect of tr.effects) {
      if (effect.is(setSpellMisspellings)) {
        const builder = new RangeSetBuilder<Decoration>()
        for (const range of effect.value) builder.add(range.from, range.to, spellMark)
        deco = builder.finish()
      }
    }
    return deco
  },
  provide: (field) => EditorView.decorations.from(field),
})

/** Append once per editor instance. */
export const cmSpellDecorations: Extension = spellDecorations

/** Append (possibly repeatedly) to force browser-native spellcheck on. */
export function spellcheckContentAttributes(locale: string): Extension {
  return EditorView.contentAttributes.of({
    spellcheck: 'true',
    autocorrect: 'on',
    autocomplete: 'on',
    lang: locale,
  })
}
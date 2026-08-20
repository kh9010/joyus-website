// ---------------------------------------------------------------------------
// PROMPT ASSEMBLER — builds the two turns that go to the model.
//
// The system turn is the v4 analysis prompt, verbatim and unmodified. The user
// turn is the fact sheet, serialized in exactly the shape v4's "INPUT — THE
// FACT SHEET" section documents, plus (on a repair attempt) the violation list.
//
// No shape-directive addendum is appended: v4 documents `shape_directive` as a
// fact-sheet field and devotes a whole section to it, so adding a second
// explanation would be a second version of the same instruction.
// ---------------------------------------------------------------------------

import { ANALYSIS_PROMPT } from './analysisPrompt.js';

export function assemblePrompt(factSheet, repairNote) {
  const parts = [];
  if (repairNote) parts.push(repairNote, '');
  parts.push('Fact sheet:', '```json', JSON.stringify(factSheet, null, 2), '```');
  return { system: ANALYSIS_PROMPT, user: parts.join('\n') };
}

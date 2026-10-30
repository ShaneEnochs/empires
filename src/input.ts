/** Normalize one explicit player submission; never interpret its contents. */
export function validateTextInput(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Text input must be a string.');
  if (/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u.test(value)) {
    throw new Error('Text input cannot contain line breaks or control characters.');
  }
  const text = value.trim();
  const length = [...text].length;
  if (length < 1 || length > 80) throw new Error('Enter between 1 and 80 characters.');
  return text;
}

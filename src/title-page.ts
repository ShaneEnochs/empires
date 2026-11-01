import configuration from '../content/title-page.json' with { type: 'json' };

export interface TitlePage {
  readonly brand: string;
  readonly title: string;
  readonly description: string;
  readonly continueGameLabel: string;
  readonly newGameLabel: string;
}

export function validateTitlePage(value: unknown): Readonly<TitlePage> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('content/title-page.json must contain an object.');
  }
  const result = {} as Record<keyof TitlePage, string>;
  for (const field of ['brand', 'title', 'description', 'continueGameLabel', 'newGameLabel'] as const) {
    const text = Reflect.get(value, field);
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error(`content/title-page.json: ${field} must be nonempty text.`);
    }
    result[field] = text;
  }
  return Object.freeze(result);
}

export const titlePage = validateTitlePage(configuration);

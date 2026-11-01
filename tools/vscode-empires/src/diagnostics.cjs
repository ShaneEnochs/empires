const { parseStory } = require('../dist/parser.cjs');
function problem(text, lineCount) {
  try { parseStory(text); return undefined; }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const match = /^Line ([1-9]\d*)(?:, passage "[^"]+")?: /.exec(message);
    const line = match ? Number(match[1]) - 1 : undefined;
    return { message, line: line !== undefined && line < lineCount ? line : undefined };
  }
}
function register(api, context) {
  const collection = api.languages.createDiagnosticCollection('empires-story');
  const output = api.window.createOutputChannel('Empires Story');
  function validate(document) {
    if (document.languageId !== 'empires-story') return;
    const error = problem(document.getText(), document.lineCount);
    if (!error) { collection.delete(document.uri); return; }
    if (error.line === undefined) {
      collection.delete(document.uri); output.appendLine(`${document.uri.toString()}: ${error.message}`); return;
    }
    const line = document.lineAt(error.line);
    const range = new api.Range(error.line, line.firstNonWhitespaceCharacterIndex, error.line, line.text.length);
    const diagnostic = new api.Diagnostic(range, error.message, api.DiagnosticSeverity.Error);
    diagnostic.source = 'Empires parser'; collection.set(document.uri, [diagnostic]);
  }
  context.subscriptions.push(collection, output, api.workspace.onDidOpenTextDocument(validate),
    api.workspace.onDidSaveTextDocument(validate), api.workspace.onDidCloseTextDocument(document => collection.delete(document.uri)));
  for (const document of api.workspace.textDocuments) validate(document);
}
module.exports = { problem, register };

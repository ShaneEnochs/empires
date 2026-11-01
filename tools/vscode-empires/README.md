# Empires Story for VS Code

This local extension registers `.story` as **Empires Story**, highlights supported
commands using theme-defined TextMate scopes, and reports the existing parser's
first syntax/reference error on open and save. It does not run preflight, interpret
stories, or modify source files, gameplay, preview behavior, or saved progress.

From the repository root:

```sh
npm ci --prefix tools/vscode-empires
npm test --prefix tools/vscode-empires
npm run package --prefix tools/vscode-empires
```

In VS Code, open Extensions (Ctrl+Shift+X), choose the `…` menu → **Install from
VSIX…**, and select `tools/vscode-empires/empires-story-0.1.0.vsix`. Reload if
prompted. Open a `.story` document and verify the status-bar language is **Empires
Story**. Cloning alone does not install the extension. No Marketplace account,
publisher credentials, external service, or publication is required.

Keep the repository folder open to use the existing 20 `emp-` snippets (Ctrl+Space)
and three Empires tasks. The workspace snippets are the single source; the extension
does not ship a competing copy. Outside this workspace, copy that snippet file into
your VS Code user snippets if desired. Without the extension, manually select Plain
Text to continue editing with the same snippets; install the extension to use automatic language support.

Save a file containing `*unknown` to see a red squiggle and Problems entry. Clicking
it jumps to the parser's actual line. Fix and save to clear it. Diagnostics preserve
passage IDs/messages, stop at the parser's first error, and clear on close. If an
error has no reliable source line, it is logged in Output → Empires Story rather
than assigned an invented range. No idle/keystroke analysis is performed.

Use **Empires: Check Current Story** for full bounded preflight, including advisory
reachability/cycle warnings, reproduced runtime failures, and exploration limits.
Those findings are separate from editor syntax diagnostics.

For extension development, open this directory in VS Code and launch an Extension
Development Host with `code --extensionDevelopmentPath=<absolute path to this directory>`
after building. Validate open/save/correction/close behavior with two story files.
The automated suite exercises the actual TextMate grammar with Oniguruma and the
DiagnosticCollection event wiring using a VS Code API test double. Generated parser
bundles, dependencies, and VSIX packages are ignored by Git.

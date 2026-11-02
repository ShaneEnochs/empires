const vscode = require('vscode');
const { register } = require('./diagnostics.cjs');
exports.activate = context => register(vscode, context);

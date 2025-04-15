import * as vscode from 'vscode';
import { handleHttpTestCommand } from './httpTestManager';
import { HttpTestCodeLensProvider } from './codeLensProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "httplens" is now active!');

	const csharpSelector: vscode.DocumentSelector = { language: 'csharp', scheme: 'file' };
	const codeLensProvider = new HttpTestCodeLensProvider();
	context.subscriptions.push(
		vscode.languages.registerCodeLensProvider(csharpSelector, codeLensProvider)
	);

	const handleHttpTest = vscode.commands.registerCommand('httplens.handleHttpTest', handleHttpTestCommand);
	context.subscriptions.push(handleHttpTest);
}

export function deactivate() {}

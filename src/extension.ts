import * as vscode from 'vscode'
import { handleHttpTestCommand } from './httpTestManager'
import { HttpTestCodeLensProvider } from './codeLensProvider'
import { HttpFileCodeLensProvider } from './httpFileCodeLensProvider'
import { goToCodeFromHttp } from './goToCodeFromHttp'

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "httplens" is now active!')

	const csharpSelector: vscode.DocumentSelector = { language: 'csharp', scheme: 'file' }
	const codeLensProvider = new HttpTestCodeLensProvider()
	context.subscriptions.push(
		vscode.languages.registerCodeLensProvider(csharpSelector, codeLensProvider)
	)

	// Register CodeLens for .http files
	const httpSelector: vscode.DocumentSelector = { language: 'http', scheme: 'file' }
	const httpFileCodeLensProvider = new HttpFileCodeLensProvider()
	context.subscriptions.push(
		vscode.languages.registerCodeLensProvider(httpSelector, httpFileCodeLensProvider)
	)

	const handleHttpTest = vscode.commands.registerCommand('httplens.handleHttpTest', handleHttpTestCommand)
	context.subscriptions.push(handleHttpTest)

	// Register goToCodeFromHttp command
	const goToCodeFromHttpCmd = vscode.commands.registerCommand('httplens.goToCodeFromHttp', goToCodeFromHttp)
	context.subscriptions.push(goToCodeFromHttpCmd)
}

export function deactivate() {}

import * as vscode from 'vscode'
import { UI_STRINGS } from './strings'

export class HttpFileCodeLensProvider implements vscode.CodeLensProvider {
	async provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.CodeLens[]> {
		const lenses: vscode.CodeLens[] = []
		const text = document.getText()
		const lines = text.split(/\n/)
		// Only scan for HTTP request lines (e.g. GET /route)
		const requestRegex = /^(GET|POST|PUT|DELETE|PATCH)\s+([^\s]+)(?:\s|$)/i
		for (let i = 0; i < lines.length; i++) {
			const match = lines[i].match(requestRegex)
			if (match) {
				const method = match[1].toUpperCase()
				const route = match[2]
				// Add a CodeLens above this line
				const pos = new vscode.Position(i, 0)
				lenses.push(new vscode.CodeLens(new vscode.Range(pos, pos), {
					title: UI_STRINGS.goToCode,
					command: 'httplens.goToCodeFromHttp',
					arguments: [document.uri, method, route],
				}))
			}
		}
		return lenses
	}
}

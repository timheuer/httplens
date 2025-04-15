import * as vscode from 'vscode';

// Localizable UI constants
export const UI_TEXT = {
	createHttpTest: 'Create HTTP Test',
	goToHttpTest: 'Go to HTTP Test',
};

export class HttpTestCodeLensProvider implements vscode.CodeLensProvider {
	private onDidChangeCodeLensesEmitter = new vscode.EventEmitter<void>()
	readonly onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event

	constructor() {
		const pattern = new vscode.RelativePattern(
			vscode.workspace.workspaceFolders?.[0].uri.fsPath || '',
			'tests/http/*.http'
		)
		const watcher = vscode.workspace.createFileSystemWatcher(pattern)
		watcher.onDidCreate(() => this.onDidChangeCodeLensesEmitter.fire())
		watcher.onDidDelete(() => this.onDidChangeCodeLensesEmitter.fire())
		watcher.onDidChange(() => this.onDidChangeCodeLensesEmitter.fire())
	}

	async provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.CodeLens[]> {
		const lenses: vscode.CodeLens[] = []
		const text = document.getText()
		const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri)
		if (!workspaceFolder) {
			return lenses
		}

		// Find all .http files in the workspace
		const httpFiles = await vscode.workspace.findFiles('**/*.http')

		async function hasMatchingRequest(method: string, route: string): Promise<{ file?: vscode.Uri, found?: boolean }> {
			const routePath = route.startsWith('/') ? route : `/${route}`
			const methodUpper = method.toUpperCase()
			for (const file of httpFiles) {
				try {
					const content = (await vscode.workspace.fs.readFile(file)).toString()
					const lines = content.split(/\r?\n/)
					for (let i = 0; i < lines.length; i++) {
						const line = lines[i]
						const match = line.match(/^(GET|POST|PUT|DELETE|PATCH)\s+([^\s]+)\s+HTTP\//i)
						if (match && match[1].toUpperCase() === methodUpper && match[2].endsWith(routePath)) {
							return { file, found: true }
						}
					}
				} catch {}
			}
			return { found: false }
		}

		const controllerRegex = /\[(HttpGet|HttpPost|HttpPut|HttpDelete|HttpPatch)(\(.*?\))?\]\s*public\s+\w+\s+(\w+)\s*\(([^)]*)\)/g
		let match: RegExpExecArray | null
		while ((match = controllerRegex.exec(text)) !== null) {
			const method = match[1]
			const methodName = match[3]
			const pos = document.positionAt(match.index)
			const found = await hasMatchingRequest(method, methodName)
			const title = found.found ? UI_TEXT.goToHttpTest : UI_TEXT.createHttpTest
			const testFileUri = found.file
			lenses.push(this.createLens(document, pos, method, methodName, 'controller', title, testFileUri))
		}

		const minimalApiRegex = /app\.(MapGet|MapPost|MapPut|MapDelete|MapPatch)\s*\(([^,]+),/g
		while ((match = minimalApiRegex.exec(text)) !== null) {
			const method = match[1].replace('Map', '').toUpperCase()
			const route = match[2].trim().replace(/['"`]/g, '')
			const pos = document.positionAt(match.index)
			const found = await hasMatchingRequest(method, route)
			const title = found.found ? UI_TEXT.goToHttpTest : UI_TEXT.createHttpTest
			const testFileUri = found.file
			lenses.push(this.createLens(document, pos, method, route, 'minimal', title, testFileUri))
		}

		return lenses
	}

	private createLens(
		document: vscode.TextDocument,
		pos: vscode.Position,
		method: string,
		routeOrName: string,
		type: 'controller' | 'minimal',
		title: string,
		testFileUri?: vscode.Uri
	): vscode.CodeLens {
		return new vscode.CodeLens(new vscode.Range(pos, pos), {
			title,
			command: 'httplens.handleHttpTest',
			arguments: [document.uri, method, routeOrName, type, testFileUri]
		})
	}
}

async function fileExists(uri: vscode.Uri): Promise<boolean> {
	try {
		await vscode.workspace.fs.stat(uri)
		return true
	} catch {
		return false
	}
}

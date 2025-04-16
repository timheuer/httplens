import * as vscode from 'vscode'

// Localizable UI constants
export const UI_TEXT = {
	createHttpTest: 'Create HTTP Test',
	goToHttpTest: 'Go to HTTP Test',
}

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

		function extractMainRoute(path: string): string {
			// Remove host (http://..., https://..., or {{host}})
			path = path.replace(/^https?:\/\/[^/]+/, '')
			path = path.replace(/^{{[^}]+}}/, '')
			// Remove leading slashes
			path = path.replace(/^\/+/, '')
			// Get the first segment before next slash or end
			const match = path.match(/^([^\/]+)/)
			return match ? `/${match[1]}` : '/'
		}

		async function hasMatchingRequest(method: string, route: string): Promise<{ file?: vscode.Uri, found: boolean, line?: number }> {
			const routePath = route.startsWith('/') ? route : `/${route}`
			const methodUpper = method.toUpperCase()
			const expectedMainRoute = extractMainRoute(routePath)
			for (const file of httpFiles) {
				try {
					const content = (await vscode.workspace.fs.readFile(file)).toString()
					const lines = content.split(/\r?\n/)
					for (let i = 0; i < lines.length; i++) {
						const line = lines[i]
						const match = line.match(/^(GET|POST|PUT|DELETE|PATCH)\s+([^\s]+)(?:\s|$)/i)
						if (match && match[1].toUpperCase() === methodUpper) {
							const matchedMainRoute = extractMainRoute(match[2])
							if (matchedMainRoute === expectedMainRoute) {
								return { file, found: true, line: i }
							}
						}
					}
				} catch {}
			}
			return { found: false }
		}

		// Extract class-level [Route] attribute and controller class name
		let classRoute = ''
		let controllerClassName = ''
		const classRouteMatch = text.match(/\[Route\(([^\)]*)\)\][^\n]*\n\s*public class\s+(\w+)/)
		if (classRouteMatch) {
			classRoute = classRouteMatch[1].trim().replace(/^["'`]|["'`]$/g, '')
			controllerClassName = classRouteMatch[2]
			if (classRoute.includes('[controller]')) {
				const controllerName = controllerClassName.replace(/Controller$/, '')
				classRoute = classRoute.replace('[controller]', controllerName)
			}
		}

		// Robust regex: match one or more [Http...] attributes, allow whitespace/comments, then public method
		const controllerRegex = /(\[Http(Get|Post|Put|Delete|Patch)[^\]]*\][\s\r\n]*)+public\s+\w[\w<>, ]*\s+(\w+)\s*\([^\)]*\)/g
		let match: RegExpExecArray | null
		while ((match = controllerRegex.exec(text)) !== null) {
			// Find the last HTTP method attribute in the match
			const attrMatch = match[0].match(/\[Http(Get|Post|Put|Delete|Patch)(?:\(([^\)]*)\))?/i)
			const method = attrMatch ? attrMatch[1] : 'GET'
			// Try to extract route from [Http...] attribute, e.g. [HttpGet("weather/{id}")]
			let methodRoute = ''
			if (attrMatch && attrMatch[2]) {
				// Remove Name = ... or other named params, just get the first string param
				const routeParamMatch = attrMatch[2].match(/^["'`](.*?)["'`]/)
				if (routeParamMatch) {
					methodRoute = routeParamMatch[1]
				}
			}
			const methodName = match[3]
			// Combine class route and method route
			let fullRoute = ''
			if (classRoute && methodRoute) {
				fullRoute = `${classRoute.replace(/\/$/, '')}/${methodRoute.replace(/^\//, '')}`
			} else if (classRoute) {
				fullRoute = classRoute
			} else if (methodRoute) {
				fullRoute = methodRoute
			} else {
				// Fallback: use class route + method name as route
				fullRoute = classRoute ? `${classRoute.replace(/\/$/, '')}/${methodName}` : methodName
			}
			if (!fullRoute.startsWith('/')) { fullRoute = '/' + fullRoute }
			const pos = document.positionAt(match.index)
			const found = await hasMatchingRequest(method, fullRoute)
			const title = found.found ? UI_TEXT.goToHttpTest : UI_TEXT.createHttpTest
			const testFileUri = found.file
			const testFileLine = found.line
			lenses.push(this.createLens(document, pos, method, fullRoute, 'controller', title, testFileUri, testFileLine))
		}

		const minimalApiRegex = /app\.(MapGet|MapPost|MapPut|MapDelete|MapPatch)\s*\(([^,]+),/g
		while ((match = minimalApiRegex.exec(text)) !== null) {
			const method = match[1].replace('Map', '').toUpperCase()
			const route = match[2].trim().replace(/['"`]/g, '')
			const pos = document.positionAt(match.index)
			const found = await hasMatchingRequest(method, route)
			const title = found.found ? UI_TEXT.goToHttpTest : UI_TEXT.createHttpTest
			const testFileUri = found.file
			const testFileLine = found.line
			lenses.push(this.createLens(document, pos, method, route, 'minimal', title, testFileUri, testFileLine))
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
		testFileUri?: vscode.Uri,
		testFileLine?: number
	): vscode.CodeLens {
		return new vscode.CodeLens(new vscode.Range(pos, pos), {
			title,
			command: 'httplens.handleHttpTest',
			arguments: [document.uri, method, routeOrName, type, testFileUri, testFileLine]
		})
	}
}

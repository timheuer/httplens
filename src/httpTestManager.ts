import * as vscode from 'vscode';

export async function handleHttpTestCommand(uri: vscode.Uri, method: string, routeOrName: string, type: 'controller' | 'minimal', testFileUri?: vscode.Uri) {
	if (testFileUri) {
		// Try to find the matching HTTP request line and reveal it
		const doc = await vscode.workspace.openTextDocument(testFileUri)
		const editor = await vscode.window.showTextDocument(doc)
		const routePath = routeOrName.startsWith('/') ? routeOrName : `/${routeOrName}`
		const methodUpper = method.toUpperCase()
		for (let i = 0; i < doc.lineCount; i++) {
			const line = doc.lineAt(i).text
			const match = line.match(/^(GET|POST|PUT|DELETE|PATCH)\s+([^\s]+)\s+HTTP\//i)
			if (match && match[1].toUpperCase() === methodUpper && match[2].endsWith(routePath)) {
				const range = doc.lineAt(i).range
				editor.revealRange(range, vscode.TextEditorRevealType.InCenter)
				editor.selection = new vscode.Selection(range.start, range.end)
				break
			}
		}
		return
	}
	const testFolder = vscode.Uri.joinPath(vscode.workspace.workspaceFolders?.[0].uri!, 'tests', 'http')
	const testFileName = `${method}_${routeOrName.replace(/[^a-zA-Z0-9]/g, '_')}.http`
	const testFile = vscode.Uri.joinPath(testFolder, testFileName)

	try {
		await vscode.workspace.fs.stat(testFile)
		vscode.window.showTextDocument(testFile)
	} catch {
		await vscode.workspace.fs.createDirectory(testFolder)
		const host = await getHostFromLaunchSettings() || 'http://localhost:5000'
		const httpRequest = generateHttpRequestTemplate(method, routeOrName, host)
		await vscode.workspace.fs.writeFile(testFile, Buffer.from(httpRequest, 'utf8'))
		vscode.window.showTextDocument(testFile)
	}
}

async function getHostFromLaunchSettings(): Promise<string | undefined> {
	const files = await vscode.workspace.findFiles('**/launchSettings.json', '**/node_modules/**', 1)
	if (!files.length) {
		return undefined
	}
	try {
		const content = (await vscode.workspace.fs.readFile(files[0])).toString()
		const json = JSON.parse(content)
		const profiles = json.profiles || {}
		let urls: string[] = []
		for (const key of Object.keys(profiles)) {
			const appUrl = profiles[key]?.applicationUrl
			if (typeof appUrl === 'string') {
				urls = urls.concat(appUrl.split(';'))
			}
		}
		// Prefer http over https, then first available
		const httpUrl = urls.find(u => u.startsWith('http://'))
		const anyUrl = urls[0]
		return httpUrl || anyUrl
	} catch {
		return undefined
	}
}

export function generateHttpRequestTemplate(method: string, routeOrName: string, host = 'http://localhost:5000'): string {
	const url = routeOrName.startsWith('/') ? `{{host}}${routeOrName}` : `{{host}}/${routeOrName}`
	return `@host = ${host}\n\n${method.toUpperCase()} ${url} HTTP/1.1\nHost: {{host}}\n\n`
}

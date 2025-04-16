import * as vscode from 'vscode'

export async function goToCodeFromHttp(uri: vscode.Uri, method: string, route: string) {
	// Find all C# files in the workspace
	const codeFiles = await vscode.workspace.findFiles('**/*.{cs}')
	const extractMainRoute = (path: string) => {
		// Remove host, variables, and get the first segment (e.g. /add from /add/{num1},{num2} or /add/1,2)
		path = path.replace(/^https?:\/\/[^/]+/, '')
		path = path.replace(/\{\{[^}]+\}\}/g, '') // Remove all {{...}} variables
		if (!path.startsWith('/')) {
			path = path.replace(/^[^/]+/, '')
		}
		path = path.replace(/\/+$/, '')
		const match = path.match(/^\/?([^/]+)/)
		return match ? `/${match[1]}` : '/'
	}
	const expectedMainRoute = extractMainRoute(route)
	const methodUpper = method.toUpperCase()
	for (const file of codeFiles) {
		try {
			const doc = await vscode.workspace.openTextDocument(file)
			const text = doc.getText()
			// Controller methods
			const controllerRegex = /(\[Http(Get|Post|Put|Delete|Patch)[^\]]*\][\s\r\n]*)+public\s+\w[\w<>, ]*\s+(\w+)\s*\([^\)]*\)/g
			let match: RegExpExecArray | null
			while ((match = controllerRegex.exec(text)) !== null) {
				const attrMatch = match[0].match(/\[Http(Get|Post|Put|Delete|Patch)(?:\(([^\)]*)\))?/i)
				const m = attrMatch ? attrMatch[1] : 'GET'
				let methodRoute = ''
				if (attrMatch && attrMatch[2]) {
					const routeParamMatch = attrMatch[2].match(/^['"`](.*?)['"`]/)
					if (routeParamMatch) {
						methodRoute = routeParamMatch[1]
					}
				}
				let fullRoute = methodRoute
				if (!fullRoute.startsWith('/')) { fullRoute = '/' + fullRoute }
				const matchedMainRoute = extractMainRoute(fullRoute)
				if (m.toUpperCase() === methodUpper && matchedMainRoute === expectedMainRoute) {
					const pos = doc.positionAt(match.index)
					const editor = await vscode.window.showTextDocument(doc)
					editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter)
					editor.selection = new vscode.Selection(pos, pos)
					return
				}
			}
			// Minimal APIs
			const minimalApiRegex = /app\.(MapGet|MapPost|MapPut|MapDelete|MapPatch)\s*\(([^,]+),/g
			while ((match = minimalApiRegex.exec(text)) !== null) {
				const m = match[1].replace('Map', '').toUpperCase()
				const r = match[2].trim().replace(/['"`]/g, '')
				const matchedMainRoute = extractMainRoute(r)
				if (m === methodUpper && matchedMainRoute === expectedMainRoute) {
					const pos = doc.positionAt(match.index)
					const editor = await vscode.window.showTextDocument(doc)
					editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter)
					editor.selection = new vscode.Selection(pos, pos)
					return
				}
			}
		} catch {}
	}
	vscode.window.showInformationMessage('No matching code found for this HTTP request.')
}

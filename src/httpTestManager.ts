import * as vscode from 'vscode'

function extractNormalizedPath(rawPath: string): string {
	// Remove http(s)://host, {{variable}}, or anything before first /
	let path = rawPath
	path = path.replace(/^https?:\/\/[^/]+/, '') // remove http(s)://host
	path = path.replace(/^\{\{[^}]+\}\}/, '') // remove {{variable}}
	if (!path.startsWith('/')) {
		path = path.replace(/^[^/]+/, '') // remove anything before first /
	}
	path = path.replace(/\/+$/, '') // remove trailing slashes
	return path || '/'
}

export async function handleHttpTestCommand(
    uri: vscode.Uri,
    method: string,
    routeOrName: string,
    type: 'controller' | 'minimal',
    testFileUri?: vscode.Uri,
    testFileLine?: number // <-- add this
) {
    if (testFileUri) {
        const doc = await vscode.workspace.openTextDocument(testFileUri)
        const editor = await vscode.window.showTextDocument(doc)
        if (typeof testFileLine === 'number') {
            // Go directly to the matched line
            const range = doc.lineAt(testFileLine).range
            editor.revealRange(range, vscode.TextEditorRevealType.InCenter)
            editor.selection = new vscode.Selection(range.start, range.end)
            return
        }

        // Fallback to existing logic
        const routePath = routeOrName.startsWith('/') ? routeOrName : `/${routeOrName}`
        const methodUpper = method.toUpperCase()
        for (let i = 0; i < doc.lineCount; i++) {
            const line = doc.lineAt(i).text
            const match = line.match(/^(GET|POST|PUT|DELETE|PATCH)\s+([^\s]+)(?:\s|$)/i)
            if (match && match[1].toUpperCase() === methodUpper) {
                const matchedPath = extractNormalizedPath(match[2])
                const expectedPath = extractNormalizedPath(routePath)
                if (matchedPath === expectedPath) {
                    const range = doc.lineAt(i).range
                    editor.revealRange(range, vscode.TextEditorRevealType.InCenter)
                    editor.selection = new vscode.Selection(range.start, range.end)
                    return
                }
            }
        }
        return
    }

	// Search all .http files in the workspace for a matching request
	const httpFiles = await vscode.workspace.findFiles('**/*.http')
	const routePath = routeOrName.startsWith('/') ? routeOrName : `/${routeOrName}`
	const methodUpper = method.toUpperCase()
	for (const file of httpFiles) {
		try {
			const doc = await vscode.workspace.openTextDocument(file)
			for (let i = 0; i < doc.lineCount; i++) {
				const line = doc.lineAt(i).text
				const match = line.match(/^(GET|POST|PUT|DELETE|PATCH)\s+([^\s]+)(?:\s|$)/i)
				if (match && match[1].toUpperCase() === methodUpper) {
					const matchedPath = extractNormalizedPath(match[2])
					const expectedPath = extractNormalizedPath(routePath)
					if (matchedPath === expectedPath) {
						const editor = await vscode.window.showTextDocument(doc)
						const range = doc.lineAt(i).range
						editor.revealRange(range, vscode.TextEditorRevealType.InCenter)
						editor.selection = new vscode.Selection(range.start, range.end)
						return
					}
				}
			}
		} catch {}
	}

	// Group tests by controller/feature instead of per route
	const testFolder = vscode.Uri.joinPath(vscode.workspace.workspaceFolders?.[0].uri!, 'tests', 'http')
	// Use the first segment of the route as the group (e.g., /users/123 -> users.http)
	const routeSegment = routePath.split('/').filter(Boolean)[0] || 'root'
	const testFileName = `${routeSegment}.http`
	const testFile = vscode.Uri.joinPath(testFolder, testFileName)

	const host = await getHostFromLaunchSettings() || 'http://localhost:5000'
	const httpRequest = generateHttpRequestTemplate(method.toUpperCase(), routeOrName, host)

	try {
		await vscode.workspace.fs.stat(testFile)
		// File exists, append new request at the end
		const doc = await vscode.workspace.openTextDocument(testFile)
		const edit = new vscode.WorkspaceEdit()
		const insertPos = new vscode.Position(doc.lineCount, 0)
		const separator = `\n### ${methodUpper} ${routePath}\n`
		edit.insert(testFile, insertPos, separator + httpRequest)
		await vscode.workspace.applyEdit(edit)
		await doc.save()
		vscode.window.showTextDocument(testFile)
	} catch {
		// File does not exist, create directory and file
		await vscode.workspace.fs.createDirectory(testFolder)
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

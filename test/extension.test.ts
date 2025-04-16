import * as assert from 'assert'
import * as vscode from 'vscode'
import * as path from 'path'
import { HttpTestCodeLensProvider } from '../src/codeLensProvider'
import { HttpFileCodeLensProvider } from '../src/httpFileCodeLensProvider'
import { extractNormalizedPath } from '../src/httpTestManager'

suite('HTTPLens Extension Test Suite', () => {
    let workspaceFolder: vscode.WorkspaceFolder

    suiteSetup(async () => {
        await vscode.extensions.getExtension('timheuer.httplens')?.activate()
        workspaceFolder = vscode.workspace.workspaceFolders![0]
    })

    test('C# Controller CodeLens Provider', async () => {
        const provider = new HttpTestCodeLensProvider()
        const controllerPath = path.join(workspaceFolder.uri.fsPath, 'test', 'testfiles', 'WeatherForecastController.cs')
        const minimalApiPath = path.join(workspaceFolder.uri.fsPath, 'test', 'testfiles', 'MinimalApiProgram.cs')

        // Test Controller style
        const controllerDoc = await vscode.workspace.openTextDocument(controllerPath)
        const controllerLenses = await provider.provideCodeLenses(controllerDoc, new vscode.CancellationTokenSource().token)
        
        assert.ok(controllerLenses.length > 0, 'Should provide CodeLens for Controller HTTP methods')
        assert.strictEqual(controllerLenses[0].command?.command, 'httplens.handleHttpTest', 'Should use correct command for Controller')

        // Test Minimal API style
        const minimalDoc = await vscode.workspace.openTextDocument(minimalApiPath)
        const minimalLenses = await provider.provideCodeLenses(minimalDoc, new vscode.CancellationTokenSource().token)
        
        assert.ok(minimalLenses.length > 0, 'Should provide CodeLens for Minimal API HTTP methods')
        assert.strictEqual(minimalLenses[0].command?.command, 'httplens.handleHttpTest', 'Should use correct command for Minimal API')
    })

    test('HTTP File CodeLens Provider', async () => {
        const provider = new HttpFileCodeLensProvider()
        
        // Test Controller style HTTP file
        const controllerHttpPath = path.join(workspaceFolder.uri.fsPath, 'test', 'testfiles', 'controller-test.http')
        const controllerDoc = await vscode.workspace.openTextDocument(controllerHttpPath)
        const controllerLenses = await provider.provideCodeLenses(controllerDoc, new vscode.CancellationTokenSource().token)

        assert.ok(controllerLenses.length > 0, 'Should provide CodeLens for Controller HTTP requests')
        assert.strictEqual(controllerLenses[0].command?.command, 'httplens.goToCodeFromHttp', 'Should use correct command for Controller HTTP')

        // Test Minimal API style HTTP file
        const minimalHttpPath = path.join(workspaceFolder.uri.fsPath, 'test', 'testfiles', 'minimal-api-test.http')
        const minimalDoc = await vscode.workspace.openTextDocument(minimalHttpPath)
        const minimalLenses = await provider.provideCodeLenses(minimalDoc, new vscode.CancellationTokenSource().token)

        assert.ok(minimalLenses.length > 0, 'Should provide CodeLens for Minimal API HTTP requests')
        assert.strictEqual(minimalLenses[0].command?.command, 'httplens.goToCodeFromHttp', 'Should use correct command for Minimal API HTTP')
    })

    test('Route Path Normalization', () => {
        // Test cases for path normalization
        const testCases = [
            { input: 'http://localhost:5000/api/test', expected: '/api/test' },
            { input: '{{host}}/api/test', expected: '/api/test' }
        ]

        for (const { input, expected } of testCases) {
            const result = extractNormalizedPath(input)
            assert.strictEqual(result, expected, `Failed to normalize path: ${input}`)
        }
    })

    test('Extension Commands Registration', async () => {
        const commands = await vscode.commands.getCommands(true)
        
        assert.ok(commands.includes('httplens.handleHttpTest'), 'handleHttpTest command should be registered')
        assert.ok(commands.includes('httplens.goToCodeFromHttp'), 'goToCodeFromHttp command should be registered')
    })

    test('CodeLens Provider Registration', () => {
        const extension = vscode.extensions.getExtension('timheuer.httplens')
        assert.ok(extension, 'Extension should be available')
        assert.strictEqual(extension?.isActive, true, 'Extension should be active')
    })
})

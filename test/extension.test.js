"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const codeLensProvider_1 = require("../codeLensProvider");
const httpFileCodeLensProvider_1 = require("../httpFileCodeLensProvider");
const httpTestManager_1 = require("../httpTestManager");
suite('HTTPLens Extension Test Suite', () => {
    let workspaceFolder;
    suiteSetup(async () => {
        await vscode.extensions.getExtension('timheuer.httplens')?.activate();
        workspaceFolder = vscode.workspace.workspaceFolders[0];
    });
    test('C# Controller CodeLens Provider', async () => {
        const provider = new codeLensProvider_1.HttpTestCodeLensProvider();
        const controllerPath = path.join(workspaceFolder.uri.fsPath, 'src', 'test', 'testfiles', 'WeatherForecastController.cs');
        const minimalApiPath = path.join(workspaceFolder.uri.fsPath, 'src', 'test', 'testfiles', 'MinimalApiProgram.cs');
        // Test Controller style
        const controllerDoc = await vscode.workspace.openTextDocument(controllerPath);
        const controllerLenses = await provider.provideCodeLenses(controllerDoc, new vscode.CancellationTokenSource().token);
        assert.ok(controllerLenses.length > 0, 'Should provide CodeLens for Controller HTTP methods');
        assert.strictEqual(controllerLenses[0].command?.command, 'httplens.handleHttpTest', 'Should use correct command for Controller');
        // Test Minimal API style
        const minimalDoc = await vscode.workspace.openTextDocument(minimalApiPath);
        const minimalLenses = await provider.provideCodeLenses(minimalDoc, new vscode.CancellationTokenSource().token);
        assert.ok(minimalLenses.length > 0, 'Should provide CodeLens for Minimal API HTTP methods');
        assert.strictEqual(minimalLenses[0].command?.command, 'httplens.handleHttpTest', 'Should use correct command for Minimal API');
    });
    test('HTTP File CodeLens Provider', async () => {
        const provider = new httpFileCodeLensProvider_1.HttpFileCodeLensProvider();
        // Test Controller style HTTP file
        const controllerHttpPath = path.join(workspaceFolder.uri.fsPath, 'src', 'test', 'testfiles', 'controller-test.http');
        const controllerDoc = await vscode.workspace.openTextDocument(controllerHttpPath);
        const controllerLenses = await provider.provideCodeLenses(controllerDoc, new vscode.CancellationTokenSource().token);
        assert.ok(controllerLenses.length > 0, 'Should provide CodeLens for Controller HTTP requests');
        assert.strictEqual(controllerLenses[0].command?.command, 'httplens.goToCodeFromHttp', 'Should use correct command for Controller HTTP');
        // Test Minimal API style HTTP file
        const minimalHttpPath = path.join(workspaceFolder.uri.fsPath, 'src', 'test', 'testfiles', 'minimal-api-test.http');
        const minimalDoc = await vscode.workspace.openTextDocument(minimalHttpPath);
        const minimalLenses = await provider.provideCodeLenses(minimalDoc, new vscode.CancellationTokenSource().token);
        assert.ok(minimalLenses.length > 0, 'Should provide CodeLens for Minimal API HTTP requests');
        assert.strictEqual(minimalLenses[0].command?.command, 'httplens.goToCodeFromHttp', 'Should use correct command for Minimal API HTTP');
    });
    test('Route Path Normalization', () => {
        // Test cases for path normalization
        const testCases = [
            { input: 'http://localhost:5000/api/test', expected: '/api/test' },
            { input: '{{host}}/api/test', expected: '/api/test' }
        ];
        for (const { input, expected } of testCases) {
            const result = (0, httpTestManager_1.extractNormalizedPath)(input);
            assert.strictEqual(result, expected, `Failed to normalize path: ${input}`);
        }
    });
    test('Extension Commands Registration', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('httplens.handleHttpTest'), 'handleHttpTest command should be registered');
        assert.ok(commands.includes('httplens.goToCodeFromHttp'), 'goToCodeFromHttp command should be registered');
    });
    test('CodeLens Provider Registration', () => {
        const extension = vscode.extensions.getExtension('timheuer.httplens');
        assert.ok(extension, 'Extension should be available');
        assert.strictEqual(extension?.isActive, true, 'Extension should be active');
    });
});
//# sourceMappingURL=extension.test.js.map
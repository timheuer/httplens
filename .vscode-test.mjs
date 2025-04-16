import { defineConfig } from '@vscode/test-cli'

export default defineConfig({
    files: 'out/test/**/*.test.js',
    useInstallFromGithub: true,
    version: 'stable',
    workspaceFolder: '.',
    launchArgs: ['--disable-extensions']
})

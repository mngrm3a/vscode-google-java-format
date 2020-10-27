import * as vscode from 'vscode';
import { configureJarPathCommand } from './configurator';
import { DocumentFormatter } from './formatter';

export function activate(context: vscode.ExtensionContext) {
	const channel = vscode.window.createOutputChannel('Google Java Formatter');

	let formatter = vscode.languages.registerDocumentFormattingEditProvider(
		{ scheme: 'file', language: 'java' },
		new DocumentFormatter(channel, getJarPath, openJarPathSetting)
	);

	let configurator = vscode.commands.registerCommand(
		'gjf.configureJarPath',
		configureJarPathCommand(context.globalStorageUri));

	context.subscriptions.push(
		configurator,
		formatter);
}

export function deactivate() { }

function getJarPath(): vscode.Uri | undefined {
	const jarPath: string | undefined = vscode.workspace.getConfiguration('gjf').get('jarPath');

	return jarPath !== undefined ?
		vscode.Uri.file(jarPath) :
		undefined;
}

async function openJarPathSetting(): Promise<void> {
	return vscode.commands.executeCommand('workbench.action.openSettings', 'gjf.jarPath');
}
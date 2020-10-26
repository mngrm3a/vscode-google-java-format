import * as vscode from 'vscode';
import { DocumentFormatter } from './formatter';

export function activate(context: vscode.ExtensionContext) {
	const channel = vscode.window.createOutputChannel('Google Java Formatter');

	let formatter = vscode.languages.registerDocumentFormattingEditProvider(
		{ scheme: 'file', language: 'java' },
		new DocumentFormatter(channel, getJarPath, openJarPathSetting)
	);

	context.subscriptions.push(
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
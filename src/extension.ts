import * as vscode from 'vscode';
import { DocumentFormatter } from './formatter';
import { Context, SettingsId } from "./context";

export function activate(context: vscode.ExtensionContext) {
	const localContext = new Context(context);

	let formatter = vscode.languages.registerDocumentFormattingEditProvider(
		{ scheme: 'file', language: 'java' },
		new DocumentFormatter(localContext, jarNotFoundAction)
	);

	context.subscriptions.push(
		formatter);
}

export function deactivate() { }

async function jarNotFoundAction() {
	const answer = await vscode.window.showErrorMessage(
		'Could not find Google Java Formatter Jar file',
		'Set Jar Path'
	);
	if (answer) {
		vscode.commands.executeCommand(
			'workbench.action.openSettings',
			SettingsId.JarPath);
	}
}
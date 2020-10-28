import * as vscode from 'vscode';
import { Context, SettingsId } from "./context";
import { DocumentFormatter } from './formatter';
import { setFormatterJarCommand } from "./configurator";

export function activate(context: vscode.ExtensionContext) {
	const localContext = new Context(context);

	let formatter = vscode.languages.registerDocumentFormattingEditProvider(
		{ scheme: 'file', language: 'java' },
		new DocumentFormatter(localContext, jarNotFoundAction)
	);

	let command = vscode.commands.registerCommand(
		'gjf.setJarPath',
		setFormatterJarCommand(localContext)
	);

	context.subscriptions.push(
		command,
		formatter
	);
}

export function deactivate() { }

async function jarNotFoundAction(): Promise<void> {
	const answer = await vscode.window.showErrorMessage(
		'Could not find Google Java Formatter Jar file',
		'Set Jar Path'
	);
	if (answer) {
		await vscode.commands.executeCommand(
			'workbench.action.openSettings',
			SettingsId.JarPath);
	}
}
import * as vscode from 'vscode';
import { registerDocumentFormattingEditProvider } from './formatter';

export function activate(context: vscode.ExtensionContext) {

	let documentFormattingEditProvider =
		registerDocumentFormattingEditProvider(() => getConfiguration().get('jar'));

	context.subscriptions.push(documentFormattingEditProvider);
}

export function deactivate() { }

function getConfiguration(): vscode.WorkspaceConfiguration {
	return vscode.workspace.getConfiguration('gjf');
}
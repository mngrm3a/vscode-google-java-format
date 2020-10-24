import * as vscode from 'vscode';
import { execSync } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.languages.registerDocumentFormattingEditProvider(
		{ scheme: 'file', language: 'java' },
		new DocumentFormatter()
	);

	context.subscriptions.push(disposable);
}

export function deactivate() { }

abstract class AbstractFormatter {
	private run(text: string): Promise<string> {
		return new Promise((resolve, reject) => {
			const stdout = execSync(
				`java -jar ${vscode.workspace.getConfiguration('gjf').get('jarPath')} -`,
				{
					input: text,
					windowsHide: true
				})
				.toString();

			resolve(stdout);
		});
	}

	protected format(document: vscode.TextDocument,
		range: vscode.Range,
		options: vscode.FormattingOptions,
		token: vscode.CancellationToken): Promise<vscode.TextEdit[]> {
		return new Promise((resolve, reject) => {
			token.onCancellationRequested(e => reject(e));

			if (range.isEmpty) {
				resolve([]);
			}

			this.run(document.getText(range))
				.then(s => resolve([vscode.TextEdit.replace(range, s)]))
				.catch(e => reject(e));
		});
	}
}

class DocumentFormatter extends AbstractFormatter implements vscode.DocumentFormattingEditProvider {
	provideDocumentFormattingEdits(
		document: vscode.TextDocument,
		options: vscode.FormattingOptions,
		token: vscode.CancellationToken): vscode.ProviderResult<vscode.TextEdit[]> {
		return this.format(
			document,
			new vscode.Range(
				document.lineAt(0).range.start,
				document.lineAt(document.lineCount - 1).range.end
			),
			options,
			token);
	}
}

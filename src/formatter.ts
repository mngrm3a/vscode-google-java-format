import * as vscode from 'vscode';
import { execSync } from 'child_process';
import { url } from 'inspector';

type Supplier<T> = () => T | undefined;

export function registerDocumentFormattingEditProvider(uriSupplier: Supplier<vscode.Uri>) {
  return vscode.languages.registerDocumentFormattingEditProvider(
    { scheme: 'file', language: 'java' },
    new DocumentFormatter(uriSupplier)
  );
}

abstract class AbstractFormatter {
  private uriSupplier: Supplier<vscode.Uri>;

  constructor(uriSupplier: Supplier<vscode.Uri>) {
    this.uriSupplier = uriSupplier;
  }

  private getJarUri(): vscode.Uri | undefined {
    const uri = this.uriSupplier();

    if (uri === undefined) {
      return undefined;
    } else {
      try {
        vscode.workspace.fs.stat(uri);
      } catch (exception) {
        if (exception instanceof vscode.FileSystemError) {
          return undefined;
        }
        throw exception;
      }
      return uri;
    }
  }

  private run(jarUri: vscode.Uri, stdin: string): Promise<string> {
    return new Promise((resolve) => {
      const stdout = execSync(
        `java -jar ${jarUri} -`,
        {
          input: stdin,
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

      const jarUri = this.getJarUri();
      if (jarUri === undefined) {
        reject(new Error('Formatter uri not set or invalid'));
      } else {
        this.run(jarUri, document.getText(range))
          .then(s => resolve([vscode.TextEdit.replace(range, s)]))
          .catch(e => reject(e));
      }
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
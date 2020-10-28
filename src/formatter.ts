import * as vscode from 'vscode';
import * as child_process from 'child_process';
import { Context, Action } from "./context";

export class DocumentFormatter implements
  vscode.DocumentRangeFormattingEditProvider,
  vscode.DocumentFormattingEditProvider {
  private context: Context;
  private jarNotFoundAction: Action;

  constructor(context: Context,
    jarNotFoundAction: Action) {
    this.context = context;
    this.jarNotFoundAction = jarNotFoundAction;
  }

  provideDocumentRangeFormattingEdits(
    document: vscode.TextDocument,
    range: vscode.Range,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken):
    vscode.ProviderResult<vscode.TextEdit[]> {
    return this.formatDocumentRange(
      document,
      range,
      options,
      token);
  }

  provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken):
    vscode.ProviderResult<vscode.TextEdit[]> {
    return this.formatDocumentRange(
      document,
      new vscode.Range(
        document.lineAt(0).range.start,
        document.lineAt(document.lineCount - 1).range.end
      ),
      options,
      token);
  }

  private async formatDocumentRange(
    document: vscode.TextDocument,
    range: vscode.Range,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken):
    Promise<vscode.TextEdit[]> {
    try {
      const jarPath = (await this.context.getJarUri()).fsPath;
      const stdout = child_process.execSync(
        `java -jar '${jarPath}' -`,
        { input: document.getText(range), windowsHide: true }
      ).toString();

      return [vscode.TextEdit.replace(range, stdout)];
    } catch (error) {
      this.context.channel.appendLine(`Formatting of '${document.fileName}' failed with:`);
      this.context.channel.appendLine(
        error instanceof Error && error.stack ? error.stack : error
      );

      if (error instanceof vscode.FileSystemError) {
        this.jarNotFoundAction();
      }

      return [];
    }
  }
}

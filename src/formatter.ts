import * as vscode from 'vscode';
import * as child_process from 'child_process';

type JarPathSupplier = () => vscode.Uri | undefined;
type FixJarPathAction = () => Promise<void> | void;

abstract class AbstractFormatter {
  private channel: vscode.OutputChannel;
  private jarPathSupplier: JarPathSupplier;
  private fixJarPathAction: FixJarPathAction;
  constructor(channel: vscode.OutputChannel,
    jarPathSupplier: JarPathSupplier,
    fixJarPathAction: FixJarPathAction) {
    this.channel = channel;
    this.jarPathSupplier = jarPathSupplier;
    this.fixJarPathAction = fixJarPathAction;
  }

  protected async formatDocumentRange(
    document: vscode.TextDocument,
    range: vscode.Range,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken):
    Promise<vscode.TextEdit[]> {
    const jarPath = this.jarPathSupplier();

    try {
      if (jarPath === undefined) {
        throw vscode.FileSystemError.FileNotFound('Jar Path is undefined');
      }
      await vscode.workspace.fs.stat(jarPath);

      const stdout = await runJarFile(jarPath.fsPath, document.getText(range));

      return [vscode.TextEdit.replace(range, stdout)];
    } catch (error) {
      this.handleError(document.fileName, error);
      return [];
    }
  }

  private async handleError(fileName: string, error: any): Promise<void> {
    this.logErrorToChannel(fileName, error);

    if (error instanceof vscode.FileSystemError) {
      const messageItem = await vscode.window.showErrorMessage(
        'Could not find Google Java Formatter Jar file',
        'Set Jar Path');
      if (messageItem !== undefined) {
        this.fixJarPathAction();
      }
    }
  }

  private logErrorToChannel(fileName: string, error: any): void {
    this.channel.appendLine(`Formatting of '${fileName}' failed with:`);
    if (error instanceof Error && error.stack) {
      this.channel.appendLine(error.stack);
    } else {
      this.channel.appendLine(error);
    }
  }

}

export class DocumentFormatter extends AbstractFormatter implements
  vscode.DocumentRangeFormattingEditProvider,
  vscode.DocumentFormattingEditProvider {
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
}

async function runJarFile(path: string, stdin: string): Promise<string> {
  const command = `java -jar ${path} -`;
  const options = {
    input: stdin,
    windowsHide: true
  };

  return child_process.execSync(command, options).toString();
}

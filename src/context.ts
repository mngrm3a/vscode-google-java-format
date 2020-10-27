import * as vscode from 'vscode';

export enum SettingsId {
  JarPath = 'gjf.jarPath'
}

export class Context {
  readonly channel: vscode.OutputChannel;

  constructor(context: vscode.ExtensionContext) {
    this.channel = vscode.window.createOutputChannel('Google Java Formatter');
  }

  public async getJarUri(): Promise<vscode.Uri> {
    const rawPath: string | undefined = this.getSection('jarPath');

    if (rawPath === undefined || rawPath === '') {
      throw vscode.FileSystemError.FileNotFound('Jar Path is not set');
    } else {
      const jarPath = vscode.Uri.file(rawPath);
      await vscode.workspace.fs.stat(jarPath);

      return jarPath;
    }
  }

  public async setJarPath(jarPath: vscode.Uri) {
    await vscode.workspace.fs.stat(jarPath);
    this.setSection('jarPath', jarPath.fsPath);
  }

  private getSection(section: string): any {
    return vscode.workspace.getConfiguration('gjf').get(section);
  }

  private setSection(section: string, value: any) {
    vscode.workspace.getConfiguration('gjf').update(section, value, false);
  }
}

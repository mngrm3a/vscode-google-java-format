import * as vscode from 'vscode';
import * as path from "path";

export type Action = () => Promise<void>;

export enum SettingsId {
  JarPath = 'gjf.jarPath'
}

export class Context {
  readonly channel: vscode.OutputChannel;
  readonly cache: Cache;

  constructor(context: vscode.ExtensionContext) {
    this.channel = vscode.window.createOutputChannel('Google Java Formatter');
    this.cache = new Cache(context.globalStorageUri);
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

class Cache {
  private globalStorageUri: vscode.Uri;

  constructor(globalStorageUri: vscode.Uri) {
    this.globalStorageUri = globalStorageUri;
  }

  public async resolve(fileName: string): Promise<vscode.Uri | undefined> {
    const cachedUri = this.fileNameToCacheUri(fileName);

    try {
      await vscode.workspace.fs.stat(cachedUri);
      return cachedUri;
    } catch (error) {
      if (error instanceof vscode.FileSystemError) {
        return undefined;
      }

      throw error;
    }
  }

  public async add(fileName: string, content: Uint8Array) {
    const cacheUri = this.fileNameToCacheUri(fileName);

    return vscode.workspace.fs.writeFile(cacheUri, content);
  }

  private fileNameToCacheUri(fileName: string) {
    return vscode.Uri.file(path.join(this.globalStorageUri.path, fileName));
  }
}

import * as vscode from 'vscode';
import * as https from 'https';

export function configureJarPathCommand(globalStoragePath: vscode.Uri): () => Promise<void> {
  return async () => {
    const resolveFileName = fileNameResolver(globalStoragePath);
    const downloadFile = fileDownloader(globalStoragePath);

    const quickPickResult = await showReleaseAssetQuickPicks(resolveFileName);

    if (quickPickResult) {
      const asset: Asset = quickPickResult.asset;
      const localFile = await resolveFileName(asset.name);
      vscode.window.showInformationMessage(`file is ${localFile}`);
      if (!localFile && (await showDownloadConfirmationDialog(asset))) {
        // vscode.window.withProgress(
        //   { location: vscode.ProgressLocation.Notification },
        //   async (progress, token) => {
        //     const delay = async (n: number) => new Promise(resolve => setTimeout(resolve, n));
        //     for (let n = 0; n < 5; n++) {
        //       await delay(n * 500);
        //       progress.report({ message: `Step ${n}`, increment: n });
        //     }
        //   });
      } else {
        vscode.window.showInformationMessage(`i was here ${localFile?.path}`);
        vscode.workspace.getConfiguration('gjf').update('jarPath', localFile?.path, false);
      }
    }
  };
}

async function showDownloadConfirmationDialog(asset: Asset): Promise<boolean> {
  const answer = await vscode.window.showInformationMessage(
    `Download and install ${asset.name} from ${asset.url}`,
    { modal: false },
    'Yes', 'No');

  return answer === 'Yes';
}

class AssetQuickPickItem implements vscode.QuickPickItem {
  asset: Asset;
  isCached: boolean;
  label: string;
  description?: string | undefined;
  detail?: string | undefined;
  picked?: boolean | undefined;
  alwaysShow?: boolean | undefined;

  constructor(asset: Asset, isCached: boolean) {
    const iconName = isCached ? 'check' : 'cloud';
    this.asset = asset;
    this.isCached = isCached;
    this.label = `Google Java Formatter ${asset.label}`;
    this.detail = `$(${iconName}) ${asset.name}`;
  }
}

async function showReleaseAssetQuickPicks(resolveFile: FileNameResolver): Promise<AssetQuickPickItem | undefined> {
  const assets = await queryReleaseAssets();
  const items = await Promise.all(assets.map(async (asset: Asset) => {
    const isCached = (await resolveFile(asset.name)) !== undefined;
    return new AssetQuickPickItem(asset, isCached);
  }));
  return vscode.window.showQuickPick(items);
}

interface Asset {
  name: string;
  url: string;
  label: string;
}

async function queryReleaseAssets(): Promise<Asset[]> {
  const releases = await queryReleases();

  return releases.filter(release => !(release.draft || release.prerelease))
    .flatMap(release => release.assets.filter(asset => /.*all-deps.jar$/.test(asset.name))
      .map(asset => ({
        name: asset.name,
        label: release.name,
        url: asset.url
      })));
};

interface Release {
  name: string;
  draft: boolean;
  prerelease: boolean;
  assets: Asset[];
}

async function queryReleases(): Promise<Release[]> {
  const httpOptions = {
    hostname: 'api.github.com',
    path: '/repos/google/google-java-format/releases',
    headers: {
      'User-Agent': 'vscode-google-java-formatter',
      'Accept': 'application/vnd.github.v3+json'
    }
  };

  return new Promise(resolve => {
    https.get(httpOptions, response => {
      response.setEncoding('utf8');
      let rawData: string = '';
      response.on('data', chunk => {
        rawData += chunk;
      });

      response.on('end', () => resolve(JSON.parse(rawData)));
    });
  });
}

type FileNameResolver = (fileName: string) => Promise<vscode.Uri | undefined>;

function fileNameResolver(globalStorage: vscode.Uri): FileNameResolver {
  return async (fileName: string) => {
    const file = vscode.Uri.parse(`file://${globalStorage.fsPath}/${fileName}`);

    try {
      await vscode.workspace.fs.stat(file);
      return file;
    } catch (error) {
      if (error instanceof vscode.FileSystemError) {
        return undefined;
      }

      throw error;
    }
  };
}

type FileDownloader = (remoteFile: vscode.Uri) => Promise<vscode.Uri>;
function fileDownloader(globalStorage: vscode.Uri): FileDownloader {
  // const fs = vscode.
  return async (remoteFile: vscode.Uri) => {
    return vscode.Uri.parse('');
  };
}
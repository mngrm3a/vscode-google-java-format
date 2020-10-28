import * as vscode from 'vscode';
import * as https from 'https';
import { Context, Action } from "./context";

export function setFormatterJarCommand(context: Context): Action {
  return async () => {
    const assets = await queryReleaseAssets();
    const quickPickItems = await buildAssetQuickPickItems(context, assets);
    const selectedQuickPick = await vscode.window.showQuickPick(quickPickItems);

    if (selectedQuickPick) {
      if (!selectedQuickPick.localUri) {
        selectedQuickPick.localUri = await downloadAsset(vscode.Uri.parse(selectedQuickPick.asset.url));
      }
      context.setJarPath(selectedQuickPick.localUri);
    }
  };
}

class AssetQuickPickItem implements vscode.QuickPickItem {
  asset: Asset;
  localUri?: vscode.Uri;
  label: string;
  description?: string | undefined;
  detail?: string | undefined;
  picked?: boolean | undefined;
  alwaysShow?: boolean | undefined;

  constructor(asset: Asset, localUri?: vscode.Uri) {
    const iconName = localUri ? 'check' : 'cloud';
    this.asset = asset;
    this.localUri = localUri;
    this.label = `Google Java Formatter ${asset.label}`;
    this.detail = `$(${iconName}) ${asset.name}`;
  }
}

interface Asset {
  name: string;
  url: string;
  label: string;
}

interface Release {
  name: string;
  draft: boolean;
  prerelease: boolean;
  assets: Asset[];
}

async function downloadAsset(assetUri: vscode.Uri): Promise<vscode.Uri> {
  throw new Error('Not implemented yet');
}

async function buildAssetQuickPickItems(context: Context, assets: Asset[]): Promise<AssetQuickPickItem[]> {
  return Promise.all(assets.map(async (asset: Asset) => {
    const localUri = await context.cache.resolve(asset.name);
    return new AssetQuickPickItem(asset, localUri);
  }));
}

async function showDownloadConfirmationDialog(asset: Asset): Promise<boolean> {
  const answer = await vscode.window.showInformationMessage(
    `Download and install ${asset.name} from ${asset.url}`,
    { modal: false },
    'Yes', 'No');

  return answer === 'Yes';
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
import path from 'path';
import { FileSystemUtils } from '../utils/file-system.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('WorkspaceManager');

export class WorkspaceManager {
  private readonly brandSlug: string;
  public readonly brandRoot: string;

  constructor(public readonly brandName: string) {
    if (!brandName) {
      throw new Error('Brand name must be provided to WorkspaceManager.');
    }
    this.brandSlug = this.slugify(brandName);
    this.brandRoot = path.resolve(process.cwd(), '.brandos', this.brandSlug);
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  public getPath(subfolder: 'inputs' | 'outputs' | 'documents' | 'resources' | 'logs' | 'db'): string {
    return path.join(this.brandRoot, subfolder);
  }

  public async ensureBrandWorkspace(): Promise<void> {
    logger.info(`Ensuring workspace exists for brand: ${this.brandName}`);
    await FileSystemUtils.ensureDirectoryExists(this.brandRoot);

    const subfolders: ('inputs' | 'outputs' | 'documents' | 'resources' | 'logs' | 'db')[] = [
      'inputs',
      'outputs',
      'documents',
      'resources',
      'logs',
      'db',
    ];

    for (const folder of subfolders) {
      await FileSystemUtils.ensureDirectoryExists(this.getPath(folder));
    }
    logger.info(`Workspace ready at: ${this.brandRoot}`);
  }
}

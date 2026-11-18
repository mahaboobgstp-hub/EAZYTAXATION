export interface SaveDocumentOptions {
  fileName: string;
  folder: string;
  data: string;
  mimeType?: string;
}

export interface SaveDocumentResult {
  uri: string;
  fileName: string;
  relativePath: string;
}

export interface DocumentStoragePlugin {
  saveDocument(options: SaveDocumentOptions): Promise<SaveDocumentResult>;
}

export class MemberImportDTO {
  appId: string;
  fileInfos: Array<{
    key: string;
    checksum: string;
  }>;
}

export class MemberExportDTO {
  appId: string;
  memberIds: Array<string>;
  exportMime?: string;
}

export class MemberImportResultDTO {
  toInsertCount: number;
  insertedCount: number;
  failedCount: number;
  failedErrors: any;
}

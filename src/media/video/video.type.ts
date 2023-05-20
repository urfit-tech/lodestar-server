export type CfVideoStreamOptions = {
  uid: string;
  duration: number;
  thumbnail: string;
  watermark: string;
  thumbnailTimestampPct: number;
  status: {
    state: 'queued' | 'inprogress' | 'pendingupload' | 'downloading' | 'ready' | 'error';
    errorReasonCode: string;
    errorReasonText: string;
  };
  modified: string;
  created: string;
};

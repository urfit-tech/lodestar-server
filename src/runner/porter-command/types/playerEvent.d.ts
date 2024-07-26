export type ProgramContentEvent = {
  key: string;
  memberId: string;
  programContentId: string;
  valueString: string;
};

export type ParsedProgressData = {
  memberId: string;
  programContentId: string;
  progress: number;
  lastProgress: number | null;
};

export class ProgramPackageProgramContentProgressDTO {
  programId: string;
  programTitle: string;
  programCoverUrl: string | null;
  progress: number | null;
  programContentId: string | null;
  programPackageProgramId: string;
}

export class ProgramTempoDeliveryDTO {
  id: string;
  memberId: string;
  deliveredAt: string;
  programPackageProgramId: string;
}

import { ProgramPackageProgramContentProgressDTO, ProgramTempoDeliveryDTO } from './program-package.dto';

describe('dto', () => {
  describe('ProgramPackageProgramContentProgressDTO', () => {
    it('should create an instance with correct properties', () => {
      const dto = new ProgramPackageProgramContentProgressDTO();
      dto.programId = '123';
      dto.programTitle = 'Test Program';
      dto.programCoverUrl = 'http://example.com/cover.jpg';
      dto.progress = 85;
      dto.programContentId = '456';
      dto.programPackageProgramId = '789';

      expect(dto).toBeInstanceOf(ProgramPackageProgramContentProgressDTO);
      expect(dto.programId).toBe('123');
      expect(dto.programTitle).toBe('Test Program');
      expect(dto.programCoverUrl).toBe('http://example.com/cover.jpg');
      expect(dto.progress).toBe(85);
      expect(dto.programContentId).toBe('456');
      expect(dto.programPackageProgramId).toBe('789');
    });
  });

  describe('ProgramTempoDeliveryDTO', () => {
    it('should create an instance with correct properties', () => {
      const dto = new ProgramTempoDeliveryDTO();
      dto.id = '001';
      dto.memberId = 'mem001';
      dto.deliveredAt = '2024-01-01T00:00:00Z';
      dto.programPackageProgramId = 'prog001';

      expect(dto).toBeInstanceOf(ProgramTempoDeliveryDTO);
      expect(dto.id).toBe('001');
      expect(dto.memberId).toBe('mem001');
      expect(dto.deliveredAt).toBe('2024-01-01T00:00:00Z');
      expect(dto.programPackageProgramId).toBe('prog001');
    });
  });
});

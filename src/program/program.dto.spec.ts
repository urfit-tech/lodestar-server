import {
  ProgramResponseDTO,
  ProgramContentResponseDTO,
  ProgramContentsResponseDto,
  MaterialsResponseDto,
} from './program.dto';

describe('DTO Classes', () => {
  let programResponseDTO: ProgramResponseDTO;
  let programContentResponseDTO: ProgramContentResponseDTO;
  let programContentsResponseDto: ProgramContentsResponseDto;
  let materialsResponseDto: MaterialsResponseDto;

  beforeEach(() => {
    programResponseDTO = new ProgramResponseDTO();
    programResponseDTO.id = 'idValue';
    programResponseDTO.title = 'titleValue';
    programResponseDTO.coverUrl = 'coverUrlValue';
    programResponseDTO.coverMobileUrl = 'coverMobileUrlValue';
    programResponseDTO.coverThumbnailUrl = 'coverThumbnailUrlValue';
    programResponseDTO.abstract = 'abstractValue';

    programContentResponseDTO = new ProgramContentResponseDTO();
    programContentResponseDTO.appid = 'appidValue';
    programContentResponseDTO.id = 'idValue';
    programContentResponseDTO.title = 'titleValue';
    programContentResponseDTO.abstract = null;
    programContentResponseDTO.contentBodyId = 'contentBodyIdValue';
    programContentResponseDTO.publishedAt = new Date();
    programContentResponseDTO.duration = null;
    programContentResponseDTO.displayMode = 'trial';
    programContentResponseDTO.contentType = 'contentTypeValue';
    programContentResponseDTO.contentSectionTitle = 'contentSectionTitleValue';
    programContentResponseDTO.audios = [];
    programContentResponseDTO.videos = [];
    programContentResponseDTO.attachment = [];
    programContentResponseDTO.programContentBody = {
      data: {},
      description: 'descriptionValue',
      id: 'idValue',
      type: 'typeValue',
    };
    programContentResponseDTO.metadata = null;
    programContentResponseDTO.listPrice = null;
    programContentResponseDTO.salePrice = null;
    programContentResponseDTO.soldAt = new Date();
    programContentResponseDTO.pinnedStatus = true;
    programContentResponseDTO.isEquity = true;

    programContentsResponseDto = new ProgramContentsResponseDto();
    programContentsResponseDto.programContentId = 'programContentIdValue';
    programContentsResponseDto.displayMode = 'displayModeValue';

    materialsResponseDto = new MaterialsResponseDto();
    materialsResponseDto.programContentId = 'programContentIdValue';
    materialsResponseDto.id = 'idValue';
    materialsResponseDto.data = {};
    materialsResponseDto.createdAt = new Date();
  });

  it('ProgramResponseDTO should have correct properties and types', () => {
    expect(programResponseDTO).toHaveProperty('id');
    expect(programResponseDTO).toHaveProperty('title');
    expect(programResponseDTO).toHaveProperty('coverUrl');
    expect(programResponseDTO).toHaveProperty('coverMobileUrl');
    expect(programResponseDTO).toHaveProperty('coverThumbnailUrl');
    expect(programResponseDTO).toHaveProperty('abstract');
  });

  it('ProgramContentResponseDTO should have correct properties and types', () => {
    expect(programContentResponseDTO).toHaveProperty('appid');
    expect(programContentResponseDTO).toHaveProperty('id');
    expect(programContentResponseDTO).toHaveProperty('title');
    expect(programContentResponseDTO).toHaveProperty('abstract');
    expect(programContentResponseDTO.abstract).toBeNull();
    expect(programContentResponseDTO).toHaveProperty('contentBodyId');
    expect(programContentResponseDTO).toHaveProperty('publishedAt');
    expect(programContentResponseDTO.publishedAt).toBeInstanceOf(Date);
    expect(programContentResponseDTO).toHaveProperty('duration');
    expect(programContentResponseDTO.duration).toBeNull();
    expect(programContentResponseDTO).toHaveProperty('displayMode');
    expect(programContentResponseDTO).toHaveProperty('contentType');
    expect(programContentResponseDTO).toHaveProperty('contentSectionTitle');
    expect(programContentResponseDTO).toHaveProperty('audios');
    expect(programContentResponseDTO).toHaveProperty('videos');
    expect(programContentResponseDTO).toHaveProperty('attachment');
    expect(programContentResponseDTO).toHaveProperty('programContentBody');
    expect(programContentResponseDTO).toHaveProperty('metadata');
    expect(programContentResponseDTO).toHaveProperty('listPrice');
    expect(programContentResponseDTO).toHaveProperty('salePrice');
    expect(programContentResponseDTO).toHaveProperty('soldAt');
    expect(programContentResponseDTO.soldAt).toBeInstanceOf(Date);
    expect(programContentResponseDTO).toHaveProperty('pinnedStatus');
    expect(programContentResponseDTO).toHaveProperty('isEquity');
  });

  it('ProgramContentsResponseDto should have correct properties and types', () => {
    expect(programContentsResponseDto).toHaveProperty('programContentId');
    expect(programContentsResponseDto).toHaveProperty('displayMode');
  });

  it('MaterialsResponseDto should have correct properties and types', () => {
    expect(materialsResponseDto).toHaveProperty('programContentId');
    expect(materialsResponseDto).toHaveProperty('id');
    expect(materialsResponseDto).toHaveProperty('data');
    expect(materialsResponseDto).toHaveProperty('createdAt');
    expect(materialsResponseDto.createdAt).toBeInstanceOf(Date);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { CadreService } from './cadre.service';

describe('CadreService', () => {
  let service: CadreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CadreService],
    }).compile();

    service = module.get<CadreService>(CadreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

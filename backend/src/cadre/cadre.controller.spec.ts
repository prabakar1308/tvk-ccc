import { Test, TestingModule } from '@nestjs/testing';
import { CadreController } from './cadre.controller';

describe('CadreController', () => {
  let controller: CadreController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CadreController],
    }).compile();

    controller = module.get<CadreController>(CadreController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

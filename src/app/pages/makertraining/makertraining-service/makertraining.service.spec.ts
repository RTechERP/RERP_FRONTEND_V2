import { TestBed } from '@angular/core/testing';

import { MakertrainingService } from './makertraining.service';

describe('MakertrainingService', () => {
  let service: MakertrainingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MakertrainingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

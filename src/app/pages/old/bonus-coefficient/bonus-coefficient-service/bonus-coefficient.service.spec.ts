import { TestBed } from '@angular/core/testing';

import { BonusCoefficientService } from './bonus-coefficient.service';

describe('BonusCoefficientService', () => {
  let service: BonusCoefficientService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BonusCoefficientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

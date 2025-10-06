import { TestBed } from '@angular/core/testing';

import { OfficeSupplyUnitService } from './office-supply-unit-service.service';

describe('OfficeSupplyUnitService', () => {
  let service: OfficeSupplyUnitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OfficeSupplyUnitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

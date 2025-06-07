import { TestBed } from '@angular/core/testing';

import { OfficeSupplyUnitServiceService } from '../../OfficeSupplyUnit/OSU-service/office-supply-unit-service.service';

describe('OfficeSupplyUnitServiceService', () => {
  let service: OfficeSupplyUnitServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OfficeSupplyUnitServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

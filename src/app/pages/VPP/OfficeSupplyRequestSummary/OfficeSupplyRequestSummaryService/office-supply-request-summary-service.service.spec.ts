import { TestBed } from '@angular/core/testing';

import { OfficeSupplyRequestSummaryServiceService } from './office-supply-request-summary-service.service';

describe('OfficeSupplyRequestSummaryServiceService', () => {
  let service: OfficeSupplyRequestSummaryServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OfficeSupplyRequestSummaryServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

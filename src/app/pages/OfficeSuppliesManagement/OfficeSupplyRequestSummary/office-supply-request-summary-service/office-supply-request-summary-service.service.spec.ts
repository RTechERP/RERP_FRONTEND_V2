import { TestBed } from '@angular/core/testing';

import { OfficeSupplyRequestSummaryService} from './office-supply-request-summary-service.service';

describe('OfficeSupplyRequestSummaryService', () => {
  let service: OfficeSupplyRequestSummaryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OfficeSupplyRequestSummaryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

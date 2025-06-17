import { TestBed } from '@angular/core/testing';

import { WarehouseReleaseRequestService } from './warehouse-release-request.service';

describe('WarehouseReleaseRequestService', () => {
  let service: WarehouseReleaseRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WarehouseReleaseRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

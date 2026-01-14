import { TestBed } from '@angular/core/testing';

import { WarehouseReleaseRequestSlickGridService } from './warehouse-release-request-slick-grid.service';

describe('WarehouseReleaseRequestSlickGridService', () => {
  let service: WarehouseReleaseRequestSlickGridService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WarehouseReleaseRequestSlickGridService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

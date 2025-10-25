import { TestBed } from '@angular/core/testing';

import { OfficeSupplyService} from './office-supply-service.service';

describe('OfficeSuppliesService', () => {
  let service: OfficeSupplyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OfficeSupplyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

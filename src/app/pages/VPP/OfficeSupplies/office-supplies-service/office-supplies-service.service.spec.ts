import { TestBed } from '@angular/core/testing';

import { OfficeSuppliesService} from './office-supplies-service.service';

describe('OfficeSuppliesService', () => {
  let service: OfficeSuppliesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OfficeSuppliesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

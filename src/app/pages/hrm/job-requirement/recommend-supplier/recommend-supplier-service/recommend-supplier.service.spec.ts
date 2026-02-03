import { TestBed } from '@angular/core/testing';

import { RecommendSupplierService } from './recommend-supplier.service';

describe('RecommendSupplierService', () => {
  let service: RecommendSupplierService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecommendSupplierService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

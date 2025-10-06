import { TestBed } from '@angular/core/testing';

import { ProductsaleServiceService } from './product-sale-service.service';

describe('ProductsaleServiceService', () => {
  let service: ProductsaleServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductsaleServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

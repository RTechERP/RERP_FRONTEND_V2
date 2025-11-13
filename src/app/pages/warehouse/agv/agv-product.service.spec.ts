import { TestBed } from '@angular/core/testing';

import { AgvProductService } from './agv-product.service';

describe('AgvProductService', () => {
  let service: AgvProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AgvProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { PoRequestBuyService } from './po-request-buy.service';

describe('PoRequestBuyService', () => {
  let service: PoRequestBuyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PoRequestBuyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

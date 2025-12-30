import { TestBed } from '@angular/core/testing';

import { PoRequestBuySlickgridService } from './po-request-buy-slickgrid.service';

describe('PoRequestBuySlickgridService', () => {
  let service: PoRequestBuySlickgridService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PoRequestBuySlickgridService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

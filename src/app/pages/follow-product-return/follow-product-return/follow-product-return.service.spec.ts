import { TestBed } from '@angular/core/testing';

import { FollowProductReturnService } from './follow-product-return.service';

describe('FollowProductReturnService', () => {
  let service: FollowProductReturnService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FollowProductReturnService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

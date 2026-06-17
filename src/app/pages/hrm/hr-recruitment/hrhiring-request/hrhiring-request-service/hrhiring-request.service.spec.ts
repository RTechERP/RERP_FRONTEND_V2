import { TestBed } from '@angular/core/testing';

import { HrhiringRequestService } from './hrhiring-request.service';

describe('HrhiringRequestService', () => {
  let service: HrhiringRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HrhiringRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

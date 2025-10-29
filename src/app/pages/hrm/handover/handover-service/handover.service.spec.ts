import { TestBed } from '@angular/core/testing';

import { HandoverService } from './handover.service';

describe('HandoverService', () => {
  let service: HandoverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HandoverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

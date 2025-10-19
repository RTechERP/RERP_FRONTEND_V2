import { TestBed } from '@angular/core/testing';

import { HandoverMinutesService } from './handover-minutes-detail.service';

describe('HandoverMinutesService', () => {
  let service: HandoverMinutesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HandoverMinutesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { HandoverMinutesService } from './handover-minutes-service.service';

describe('HandoverMinutesServiceService', () => {
  let service: HandoverMinutesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HandoverMinutesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

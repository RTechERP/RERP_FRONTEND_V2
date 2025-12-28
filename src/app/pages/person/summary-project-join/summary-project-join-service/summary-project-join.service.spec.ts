import { TestBed } from '@angular/core/testing';

import { SummaryProjectJoinService } from './summary-project-join.service';

describe('SummaryProjectJoinService', () => {
  let service: SummaryProjectJoinService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SummaryProjectJoinService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

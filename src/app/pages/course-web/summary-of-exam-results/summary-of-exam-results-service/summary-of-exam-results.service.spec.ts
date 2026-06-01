import { TestBed } from '@angular/core/testing';

import { SummaryOfExamResultsService } from './summary-of-exam-results.service';

describe('SummaryOfExamResultsService', () => {
  let service: SummaryOfExamResultsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SummaryOfExamResultsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

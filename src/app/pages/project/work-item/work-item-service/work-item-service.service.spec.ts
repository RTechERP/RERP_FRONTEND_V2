import { TestBed } from '@angular/core/testing';

import { WorkItemServiceService } from './work-item-service.service';

describe('WorkItemServiceService', () => {
  let service: WorkItemServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkItemServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

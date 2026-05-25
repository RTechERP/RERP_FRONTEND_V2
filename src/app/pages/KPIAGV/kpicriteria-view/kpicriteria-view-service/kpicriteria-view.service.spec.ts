import { TestBed } from '@angular/core/testing';

import { KPIAGVCriteriaViewService } from './kpicriteria-view.service';

describe('KPIAGVCriteriaViewService', () => {
  let service: KPIAGVCriteriaViewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KPIAGVCriteriaViewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});


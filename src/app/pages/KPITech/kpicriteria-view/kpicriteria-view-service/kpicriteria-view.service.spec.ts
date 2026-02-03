import { TestBed } from '@angular/core/testing';

import { KpiCriteriaViewService } from './kpicriteria-view.service';

describe('KpiCriteriaViewService', () => {
  let service: KpiCriteriaViewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KpiCriteriaViewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

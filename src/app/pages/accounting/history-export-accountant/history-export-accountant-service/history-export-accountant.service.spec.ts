import { TestBed } from '@angular/core/testing';

import { HistoryExportAccountantService } from './history-export-accountant.service';

describe('HistoryExportAccountantService', () => {
  let service: HistoryExportAccountantService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HistoryExportAccountantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

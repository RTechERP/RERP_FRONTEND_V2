import { TestBed } from '@angular/core/testing';

import { HistoryImportExportService } from './history-import-export.service';

describe('HistoryImportExportService', () => {
  let service: HistoryImportExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HistoryImportExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

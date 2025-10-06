import { TestBed } from '@angular/core/testing';

import { ReportImportExportService } from './report-import-export.service';

describe('ReportImportExportService', () => {
  let service: ReportImportExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportImportExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { DocumentImportExportService } from './document-import-export.service';

describe('DocumentImportExportService', () => {
  let service: DocumentImportExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocumentImportExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

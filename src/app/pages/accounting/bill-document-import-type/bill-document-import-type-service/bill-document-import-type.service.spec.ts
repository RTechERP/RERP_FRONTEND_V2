import { TestBed } from '@angular/core/testing';

import { BillDocumentImportTypeService } from './bill-document-import-type.service';

describe('BillDocumentImportTypeService', () => {
  let service: BillDocumentImportTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BillDocumentImportTypeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

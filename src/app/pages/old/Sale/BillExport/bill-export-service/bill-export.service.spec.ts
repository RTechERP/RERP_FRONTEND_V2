import { TestBed } from '@angular/core/testing';

import { BillExportService } from './bill-export.service';

describe('BillExportService', () => {
  let service: BillExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BillExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

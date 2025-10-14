import { TestBed } from '@angular/core/testing';

import { BillImportServiceService } from './bill-import-service.service';

describe('BillImportServiceService', () => {
  let service: BillImportServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BillImportServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

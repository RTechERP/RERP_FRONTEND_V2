/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ProductExportAndBorrowService } from './product-export-and-borrow.service';

describe('Service: ProductExportAndBorrow', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductExportAndBorrowService]
    });
  });

  it('should ...', inject([ProductExportAndBorrowService], (service: ProductExportAndBorrowService) => {
    expect(service).toBeTruthy();
  }));
});

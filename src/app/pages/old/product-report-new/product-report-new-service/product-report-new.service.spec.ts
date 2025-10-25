/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ProductReportNewService } from './product-report-new.service';

describe('Service: ProductReportNew', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductReportNewService]
    });
  });

  it('should ...', inject([ProductReportNewService], (service: ProductReportNewService) => {
    expect(service).toBeTruthy();
  }));
});

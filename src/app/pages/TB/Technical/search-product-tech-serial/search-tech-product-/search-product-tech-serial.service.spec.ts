/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { SearchProductTechSerialService } from './search-product-tech-serial.service';

describe('Service: SearchProductTechSerial', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SearchProductTechSerialService]
    });
  });

  it('should ...', inject([SearchProductTechSerialService], (service: SearchProductTechSerialService) => {
    expect(service).toBeTruthy();
  }));
});

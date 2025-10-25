/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { PonccService } from './poncc.service';

describe('Service: Poncc', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PonccService]
    });
  });

  it('should ...', inject([PonccService], (service: PonccService) => {
    expect(service).toBeTruthy();
  }));
});

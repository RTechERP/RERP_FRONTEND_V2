import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DailyreportService } from './dailyreport.service';

describe('DailyreportService', () => {
  let service: DailyreportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DailyreportService]
    });
    service = TestBed.inject(DailyreportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
}); 
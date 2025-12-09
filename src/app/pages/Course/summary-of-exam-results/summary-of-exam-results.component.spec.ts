import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryOfExamResultsComponent } from './summary-of-exam-results.component';

describe('SummaryOfExamResultsComponent', () => {
  let component: SummaryOfExamResultsComponent;
  let fixture: ComponentFixture<SummaryOfExamResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryOfExamResultsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SummaryOfExamResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

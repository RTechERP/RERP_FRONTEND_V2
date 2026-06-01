import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryOfExamResultsWebComponent } from './summary-of-exam-results.component';

describe('SummaryOfExamResultsComponent', () => {
  let component: SummaryOfExamResultsWebComponent;
  let fixture: ComponentFixture<SummaryOfExamResultsWebComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryOfExamResultsWebComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SummaryOfExamResultsWebComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

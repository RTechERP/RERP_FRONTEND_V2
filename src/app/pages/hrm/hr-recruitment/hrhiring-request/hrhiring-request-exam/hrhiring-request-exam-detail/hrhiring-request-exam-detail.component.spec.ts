import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HRHiringRequestExamDetailComponent } from './hrhiring-request-exam-detail.component';

describe('HRHiringRequestExamDetailComponent', () => {
  let component: HRHiringRequestExamDetailComponent;
  let fixture: ComponentFixture<HRHiringRequestExamDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HRHiringRequestExamDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HRHiringRequestExamDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

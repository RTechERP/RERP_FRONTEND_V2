import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HRHiringRequestExamComponent } from './hrhiring-request-exam.component';

describe('HRHiringRequestExamComponent', () => {
  let component: HRHiringRequestExamComponent;
  let fixture: ComponentFixture<HRHiringRequestExamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HRHiringRequestExamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HRHiringRequestExamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

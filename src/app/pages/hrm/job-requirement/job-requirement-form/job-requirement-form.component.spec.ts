import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobRequirementFormComponent } from './job-requirement-form.component';

describe('JobRequirementFormComponent', () => {
  let component: JobRequirementFormComponent;
  let fixture: ComponentFixture<JobRequirementFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobRequirementFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobRequirementFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

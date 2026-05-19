import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobRequirementPersonalComponent } from './job-requirement-personal.component';

describe('JobRequirementPersonalComponent', () => {
  let component: JobRequirementPersonalComponent;
  let fixture: ComponentFixture<JobRequirementPersonalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobRequirementPersonalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobRequirementPersonalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

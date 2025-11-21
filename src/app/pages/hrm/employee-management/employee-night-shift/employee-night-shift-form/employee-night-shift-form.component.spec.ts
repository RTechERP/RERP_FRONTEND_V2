import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeNightShiftFormComponent } from './employee-night-shift-form.component';

describe('EmployeeNightShiftFormComponent', () => {
  let component: EmployeeNightShiftFormComponent;
  let fixture: ComponentFixture<EmployeeNightShiftFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeNightShiftFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeNightShiftFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

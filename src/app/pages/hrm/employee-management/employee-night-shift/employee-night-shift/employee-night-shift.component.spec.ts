import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeNightShiftComponent } from './employee-night-shift.component';

describe('EmployeeNightShiftComponent', () => {
  let component: EmployeeNightShiftComponent;
  let fixture: ComponentFixture<EmployeeNightShiftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeNightShiftComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeNightShiftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

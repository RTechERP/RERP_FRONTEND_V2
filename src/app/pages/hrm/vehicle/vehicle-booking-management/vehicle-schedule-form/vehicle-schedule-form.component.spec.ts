import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleScheduleFormComponent } from './vehicle-schedule-form.component';

describe('VehicleScheduleFormComponent', () => {
  let component: VehicleScheduleFormComponent;
  let fixture: ComponentFixture<VehicleScheduleFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleScheduleFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleScheduleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

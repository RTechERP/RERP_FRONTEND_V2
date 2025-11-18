import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportVehicleScheduleFormComponent } from './export-vehicle-schedule-form.component';

describe('ExportVehicleScheduleFormComponent', () => {
  let component: ExportVehicleScheduleFormComponent;
  let fixture: ComponentFixture<ExportVehicleScheduleFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportVehicleScheduleFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportVehicleScheduleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

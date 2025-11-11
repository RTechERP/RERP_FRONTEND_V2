import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProposeVehicleRepairFormComponent } from './propose-vehicle-repair-form.component';

describe('ProposeVehicleRepairFormComponent', () => {
  let component: ProposeVehicleRepairFormComponent;
  let fixture: ComponentFixture<ProposeVehicleRepairFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProposeVehicleRepairFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProposeVehicleRepairFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

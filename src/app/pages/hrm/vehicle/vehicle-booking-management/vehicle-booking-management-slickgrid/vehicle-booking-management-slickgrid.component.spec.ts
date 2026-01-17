import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleBookingManagementSlickgridComponent } from './vehicle-booking-management-slickgrid.component';

describe('VehicleBookingManagementSlickgridComponent', () => {
  let component: VehicleBookingManagementSlickgridComponent;
  let fixture: ComponentFixture<VehicleBookingManagementSlickgridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleBookingManagementSlickgridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleBookingManagementSlickgridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

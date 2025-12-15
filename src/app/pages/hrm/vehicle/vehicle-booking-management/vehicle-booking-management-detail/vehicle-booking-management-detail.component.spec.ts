import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleBookingManagementDetailComponent } from './vehicle-booking-management-detail.component';

describe('VehicleBookingManagementDetailComponent', () => {
  let component: VehicleBookingManagementDetailComponent;
  let fixture: ComponentFixture<VehicleBookingManagementDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleBookingManagementDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleBookingManagementDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleRepairHistoryComponent } from './vehicle-repair-history.component';

describe('VehicleRepairHistoryComponent', () => {
  let component: VehicleRepairHistoryComponent;
  let fixture: ComponentFixture<VehicleRepairHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleRepairHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleRepairHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

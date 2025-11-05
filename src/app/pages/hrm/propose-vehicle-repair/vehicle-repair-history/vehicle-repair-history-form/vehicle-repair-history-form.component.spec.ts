import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleRepairHistoryFormComponent } from './vehicle-repair-history-form.component';

describe('VehicleRepairHistoryFormComponent', () => {
  let component: VehicleRepairHistoryFormComponent;
  let fixture: ComponentFixture<VehicleRepairHistoryFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleRepairHistoryFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleRepairHistoryFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

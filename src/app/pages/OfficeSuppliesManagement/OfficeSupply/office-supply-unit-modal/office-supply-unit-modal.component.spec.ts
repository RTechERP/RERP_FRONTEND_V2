import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfficeSupplyUnitModalComponent } from './office-supply-unit-modal.component';

describe('OfficeSupplyUnitModalComponent', () => {
  let component: OfficeSupplyUnitModalComponent;
  let fixture: ComponentFixture<OfficeSupplyUnitModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfficeSupplyUnitModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfficeSupplyUnitModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

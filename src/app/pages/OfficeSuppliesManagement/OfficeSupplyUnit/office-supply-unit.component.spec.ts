import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfficeSupplyUnitComponent } from './office-supply-unit.component';

describe('OfficeSupplyUnitComponent', () => {
  let component: OfficeSupplyUnitComponent;
  let fixture: ComponentFixture<OfficeSupplyUnitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfficeSupplyUnitComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfficeSupplyUnitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

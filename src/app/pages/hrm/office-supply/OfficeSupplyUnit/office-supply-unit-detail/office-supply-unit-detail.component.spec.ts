import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfficeSupplyUnitDetailComponent } from './office-supply-unit-detail.component';

describe('OfficeSupplyUnitDetailComponent', () => {
  let component: OfficeSupplyUnitDetailComponent;
  let fixture: ComponentFixture<OfficeSupplyUnitDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfficeSupplyUnitDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfficeSupplyUnitDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

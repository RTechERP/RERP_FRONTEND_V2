import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfficeSupplyComponent } from './office-supply.component';

describe('OfficeSupplyComponent', () => {
  let component: OfficeSupplyComponent;
  let fixture: ComponentFixture<OfficeSupplyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfficeSupplyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfficeSupplyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

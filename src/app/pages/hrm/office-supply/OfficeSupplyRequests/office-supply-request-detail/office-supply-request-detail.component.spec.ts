import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfficeSupplyRequestDetailComponent } from './office-supply-request-detail.component';

describe('OfficeSupplyRequestDetailComponent', () => {
  let component: OfficeSupplyRequestDetailComponent;
  let fixture: ComponentFixture<OfficeSupplyRequestDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfficeSupplyRequestDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfficeSupplyRequestDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

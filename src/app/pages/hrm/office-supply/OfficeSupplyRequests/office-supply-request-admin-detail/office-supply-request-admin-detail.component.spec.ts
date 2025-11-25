import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfficeSupplyRequestAdminDetailComponent } from './office-supply-request-admin-detail.component';

describe('OfficeSupplyRequestAdminDetailComponent', () => {
  let component: OfficeSupplyRequestAdminDetailComponent;
  let fixture: ComponentFixture<OfficeSupplyRequestAdminDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfficeSupplyRequestAdminDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfficeSupplyRequestAdminDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

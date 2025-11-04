import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfficeSupplyRequestsComponent } from './office-supply-requests.component';

describe('OfficeSupplyRequestsComponent', () => {
  let component: OfficeSupplyRequestsComponent;
  let fixture: ComponentFixture<OfficeSupplyRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfficeSupplyRequestsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfficeSupplyRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

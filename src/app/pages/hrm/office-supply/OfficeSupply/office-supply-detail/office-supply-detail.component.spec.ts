import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfficeSupplyDetailComponent } from './office-supply-detail.component';

describe('OfficeSupplyDetailComponent', () => {
  let component: OfficeSupplyDetailComponent;
  let fixture: ComponentFixture<OfficeSupplyDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfficeSupplyDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfficeSupplyDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

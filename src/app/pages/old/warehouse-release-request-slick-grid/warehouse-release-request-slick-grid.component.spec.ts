import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarehouseReleaseRequestSlickGridComponent } from './warehouse-release-request-slick-grid.component';

describe('WarehouseReleaseRequestSlickGridComponent', () => {
  let component: WarehouseReleaseRequestSlickGridComponent;
  let fixture: ComponentFixture<WarehouseReleaseRequestSlickGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarehouseReleaseRequestSlickGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarehouseReleaseRequestSlickGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

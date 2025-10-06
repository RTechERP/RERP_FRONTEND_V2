import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WarehouseReleaseRequestComponent } from './warehouse-release-request.component';

describe('WarehouseReleaseRequestComponent', () => {
  let component: WarehouseReleaseRequestComponent;
  let fixture: ComponentFixture<WarehouseReleaseRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WarehouseReleaseRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WarehouseReleaseRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

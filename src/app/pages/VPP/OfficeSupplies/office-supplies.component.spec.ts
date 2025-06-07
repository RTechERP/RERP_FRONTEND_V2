import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfficeSuppliesComponent } from './office-supplies.component';

describe('OfficeSuppliesComponent', () => {
  let component: OfficeSuppliesComponent;
  let fixture: ComponentFixture<OfficeSuppliesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfficeSuppliesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfficeSuppliesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

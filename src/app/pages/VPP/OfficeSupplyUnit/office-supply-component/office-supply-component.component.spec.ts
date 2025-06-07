import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfficeSupplyComponentComponent } from './office-supply-component.component';

describe('OfficeSupplyComponentComponent', () => {
  let component: OfficeSupplyComponentComponent;
  let fixture: ComponentFixture<OfficeSupplyComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfficeSupplyComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfficeSupplyComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

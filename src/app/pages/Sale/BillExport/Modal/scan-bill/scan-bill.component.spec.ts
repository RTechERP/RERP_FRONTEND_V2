import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanBillComponent } from './scan-bill.component';

describe('ScanBillComponent', () => {
  let component: ScanBillComponent;
  let fixture: ComponentFixture<ScanBillComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanBillComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScanBillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

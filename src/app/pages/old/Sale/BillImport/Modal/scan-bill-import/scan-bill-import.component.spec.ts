import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanBillImportComponent } from './scan-bill-import.component';

describe('ScanBillImportComponent', () => {
  let component: ScanBillImportComponent;
  let fixture: ComponentFixture<ScanBillImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanBillImportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScanBillImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

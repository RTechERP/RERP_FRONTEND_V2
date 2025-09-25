import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillExportComponent } from './bill-export.component';

describe('BillExportComponent', () => {
  let component: BillExportComponent;
  let fixture: ComponentFixture<BillExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillExportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

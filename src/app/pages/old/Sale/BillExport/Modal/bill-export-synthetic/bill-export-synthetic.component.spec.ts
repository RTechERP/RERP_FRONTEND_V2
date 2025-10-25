import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillExportSyntheticComponent } from './bill-export-synthetic.component';

describe('BillExportSyntheticComponent', () => {
  let component: BillExportSyntheticComponent;
  let fixture: ComponentFixture<BillExportSyntheticComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillExportSyntheticComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillExportSyntheticComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

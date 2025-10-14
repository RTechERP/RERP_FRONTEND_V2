import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillExportDetailComponent } from './bill-export-detail.component';

describe('BillExportDetailComponent', () => {
  let component: BillExportDetailComponent;
  let fixture: ComponentFixture<BillExportDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillExportDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillExportDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

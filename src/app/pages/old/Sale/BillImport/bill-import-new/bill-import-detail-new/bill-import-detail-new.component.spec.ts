import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillImportDetailNewComponent } from './bill-import-detail-new.component';

describe('BillImportDetailNewComponent', () => {
  let component: BillImportDetailNewComponent;
  let fixture: ComponentFixture<BillImportDetailNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillImportDetailNewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillImportDetailNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

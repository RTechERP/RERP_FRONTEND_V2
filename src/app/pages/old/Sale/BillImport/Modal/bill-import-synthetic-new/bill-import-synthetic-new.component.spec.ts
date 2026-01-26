import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillImportSyntheticNewComponent } from './bill-import-synthetic-new.component';

describe('BillImportSyntheticNewComponent', () => {
  let component: BillImportSyntheticNewComponent;
  let fixture: ComponentFixture<BillImportSyntheticNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillImportSyntheticNewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillImportSyntheticNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

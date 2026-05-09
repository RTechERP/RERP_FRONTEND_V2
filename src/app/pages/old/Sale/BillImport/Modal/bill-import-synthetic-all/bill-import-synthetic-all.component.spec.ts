import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillImportSyntheticAllComponent } from './bill-import-synthetic-all.component';

describe('BillImportSyntheticAllComponent', () => {
  let component: BillImportSyntheticAllComponent;
  let fixture: ComponentFixture<BillImportSyntheticAllComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillImportSyntheticAllComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillImportSyntheticAllComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillImportSyntheticComponent } from './bill-import-synthetic.component';

describe('BillImportSyntheticComponent', () => {
  let component: BillImportSyntheticComponent;
  let fixture: ComponentFixture<BillImportSyntheticComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillImportSyntheticComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillImportSyntheticComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

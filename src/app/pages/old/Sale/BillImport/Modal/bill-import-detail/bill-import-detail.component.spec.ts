import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillImportDetailComponent } from './bill-import-detail.component';

describe('BillImportDetailComponent', () => {
  let component: BillImportDetailComponent;
  let fixture: ComponentFixture<BillImportDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillImportDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillImportDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

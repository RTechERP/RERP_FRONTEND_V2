import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PonccSummaryNewComponent } from './poncc-summary-new.component';

describe('PonccSummaryNewComponent', () => {
  let component: PonccSummaryNewComponent;
  let fixture: ComponentFixture<PonccSummaryNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PonccSummaryNewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PonccSummaryNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

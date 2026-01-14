import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PonccNewComponent } from './poncc-new.component';

describe('PonccNewComponent', () => {
  let component: PonccNewComponent;
  let fixture: ComponentFixture<PonccNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PonccNewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PonccNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

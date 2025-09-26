import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PokhHistoryComponent } from './pokh-history.component';

describe('PokhHistoryComponent', () => {
  let component: PokhHistoryComponent;
  let fixture: ComponentFixture<PokhHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PokhHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PokhHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

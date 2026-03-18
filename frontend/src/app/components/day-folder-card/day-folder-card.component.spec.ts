import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DayFolderCardComponent } from './day-folder-card.component';

describe('DayFolderCardComponent', () => {
  let component: DayFolderCardComponent;
  let fixture: ComponentFixture<DayFolderCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DayFolderCardComponent]
    });
    fixture = TestBed.createComponent(DayFolderCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollectionPickerDialogComponent } from './collection-picker-dialog.component';

describe('CollectionPickerDialogComponent', () => {
  let component: CollectionPickerDialogComponent;
  let fixture: ComponentFixture<CollectionPickerDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CollectionPickerDialogComponent]
    });
    fixture = TestBed.createComponent(CollectionPickerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

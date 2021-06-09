import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SendMediaComponent } from './send-media.component';

describe('SendMediaComponent', () => {
  let component: SendMediaComponent;
  let fixture: ComponentFixture<SendMediaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SendMediaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SendMediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

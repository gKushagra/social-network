import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestLinkComponent } from './request-link.component';

describe('RequestLinkComponent', () => {
  let component: RequestLinkComponent;
  let fixture: ComponentFixture<RequestLinkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestLinkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

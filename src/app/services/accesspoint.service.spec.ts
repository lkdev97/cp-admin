import { TestBed } from '@angular/core/testing';

import { AccesspointService } from './accesspoint.service';

describe('AccesspointService', () => {
  let service: AccesspointService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccesspointService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

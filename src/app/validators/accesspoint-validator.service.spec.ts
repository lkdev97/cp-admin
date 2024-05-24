import { TestBed } from '@angular/core/testing';

import { AccesspointValidatorService } from './accesspoint-validator.service';

describe('AccesspointValidatorService', () => {
  let service: AccesspointValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccesspointValidatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

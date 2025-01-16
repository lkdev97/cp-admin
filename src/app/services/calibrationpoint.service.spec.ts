import { TestBed } from '@angular/core/testing';

import { CalibrationpointService } from './calibrationpoint.service';

describe('CalibrationpointService', () => {
  let service: CalibrationpointService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalibrationpointService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

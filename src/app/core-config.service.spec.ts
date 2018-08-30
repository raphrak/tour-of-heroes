import { TestBed, inject } from '@angular/core/testing';

import { CoreConfigService } from './core-config.service';

describe('CoreConfigService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CoreConfigService]
    });
  });

  it('should be created', inject([CoreConfigService], (service: CoreConfigService) => {
    expect(service).toBeTruthy();
  }));
});

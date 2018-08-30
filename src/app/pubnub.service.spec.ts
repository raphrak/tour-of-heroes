import { TestBed, inject } from '@angular/core/testing';

import { PubnubService } from './pubnub.service';

describe('PubnubService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PubnubService]
    });
  });

  it('should be created', inject([PubnubService], (service: PubnubService) => {
    expect(service).toBeTruthy();
  }));
});

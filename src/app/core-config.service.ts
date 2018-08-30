import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CoreConfigService {

  private configConstants: any;

  constructor() { }

  public setConstants(config: any) {
    this.configConstants = config;
  }

  public getKey(key: string) {
    return this.configConstants[key];
  }

  public isFirefox(): boolean {
    return typeof window !== 'undefined' && window && window.navigator && window.navigator.userAgent && window.navigator.userAgent.search('Firefox') >= 0;
  }
}

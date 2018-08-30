import { Component, OnInit } from '@angular/core';

import { environment } from '../environments/environment';

import { CoreConfigService } from './core-config.service';
import { PubnubService } from './pubnub.service';
import { User } from '../user';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public title = 'Tour of Heroes';
  public users: Array<User> = [
    {
      _id: '666', 
      username: 'firefox@mozilla.org', 
      email: 'firefox@mozilla.org', 
      imageData: 'https://www.mozilla.org/media/img/logos/firefox/logo-quantum-high-res.cfd87a8f62ae.png'
    }, {
      _id: '999', 
      username: 'chrome@google.com', 
      email: 'chrome@google.com', 
      imageData: 'https://www.google.com/chrome/static/images/dev/chrome-dev-logo.svg'
    }
  ];

  constructor(private coreConfig: CoreConfigService, private pubnub: PubnubService) {
    this.coreConfig.setConstants(environment);
  }

  ngOnInit() {
    if (this.pubnub.isAvailable()) {
      this.pubnub.init(this.coreConfig.isFirefox() ? this.users[0] : this.users[1]).subscribe((message) => this.onNewChatNotification(message))
    }
  }

  isOnline(user: User) {
    return this.pubnub.isOnline(user._id);
  }

  onNewChatNotification(message) {
    console.log(message);
  }
}

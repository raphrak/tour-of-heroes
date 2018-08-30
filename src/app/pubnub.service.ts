import { Injectable } from '@angular/core';

import { CoreConfigService } from './core-config.service';

import { User } from '../user';
import { Message, PresenceEvent, StatusEvent, PubnubSender, MessageEvent, HereNowResponse, UUIDState, GlobalState } from './pubnub.interface';

import { forEach, isObject, each } from 'lodash-es';
import { Subscription, Observable, Subject, from, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';

declare const PubNub: any;

@Injectable({
  providedIn: 'root'
})
export class PubnubService {

  private pubnub: any;
  private _parentSubscription = new Subscription();
  private _mainChannel = 'demo_channel';
  private _channels: {
    [channel: string]: {
      messages: Subject<Message>,
      subscription: Subscription,
      typing?: Subject<[string, boolean]>
    };
  } = {};
  private _presenceSubject = new Subject<PresenceEvent>();
  private _messageSubject = new Subject<MessageEvent>();
  private _statusSubject = new Subject<StatusEvent>();

  protected sender: PubnubSender;
  protected onlineUsers = new Map<string, any>();

  constructor(private coreConfig: CoreConfigService) { }

  init(user: User): Observable<Message> {
    if (!this.isAvailable()) {
      return;
    }

    this._presenceSubject = !this._presenceSubject || this._presenceSubject.closed ? new Subject<PresenceEvent>() : this._presenceSubject;
    this._messageSubject = !this._messageSubject || this._messageSubject.closed ? new Subject<MessageEvent>() : this._messageSubject;
    this._statusSubject = !this._statusSubject || this._statusSubject.closed ? new Subject<StatusEvent>() : this._statusSubject;
    this._parentSubscription = !this._parentSubscription || this._parentSubscription.closed ? new Subscription() : this._parentSubscription;

    this.sender = new PubnubSender(user._id, user.username, user.imageData);
    this.pubnub = new PubNub({
      ssl: true,
      keepAlive: true,
      announceFailedHeartbeats: false,
      heartbeatInterval: 600,
      presenceTimeout: 300,
      // setPresenceTimeout: 0,
      // setPresenceTimeoutWithCustomInterval: 0,
      publishKey: this.coreConfig.getKey('pubnubPublishKey'),
      subscribeKey: this.coreConfig.getKey('pubnubSubscribeKey'),
      uuid: this.sender.id
    });

    this._parentSubscription.add(this._presenceSubject);
    this._parentSubscription.add(this._messageSubject);
    this._parentSubscription.add(this._statusSubject);

    // connect listener to subjects
    this.pubnub.addListener({
      presence: (p: PresenceEvent) => {
        if (this._presenceSubject && this._presenceSubject.next) {
          this._presenceSubject.next(p);
        }
      },
      message: (m: MessageEvent) => {
        if (this._messageSubject && this._messageSubject.next) {
          this._messageSubject.next(m);
        }
      },
      status: (s: StatusEvent) => {
        if (this._statusSubject && this._statusSubject.next) {
          if (s.error) {
            this._statusSubject.error(s.error);
          } else {
            this._statusSubject.next(s);
          }
        }
      }
    });

    // subscribe to _presenceSubject on the main channel to manage online user, ignore own events.
    let onlineUsersSubscription = this._presenceSubject.pipe(filter(({ uuid, channel }) => uuid !== this.sender.id && channel === this._mainChannel))
      .subscribe((presence: PresenceEvent) => {
        switch (presence.action) {
          case 'leave':
            this.onlineUsers.delete(presence.uuid);
            break;
          case 'join':
          case 'state-change':
            this.onlineUsers.set(presence.uuid, presence.state || {});
            break;
          case 'timeout':
            this.onlineUsers.set(presence.uuid, null);
            break;
          case 'interval':
            each(presence.join, userId => {
              this.onlineUsers.set(userId, {});
            });
            // each(presence.timedout, userId => {
            //     this.onlineUsers.set(userId, null);
            // });
            each(presence.leave, userId => {
              this.onlineUsers.delete(userId);
            });

            if (presence.here_now_refresh && presence.channel === this._mainChannel) {
              this.updateOnlineUsers();
            }
            break;
        }
      });
    this._parentSubscription.add(onlineUsersSubscription);

    let initMessageChannels: string[] = [];
    //we use the main channel for online/presence detection, subscribe to the presence channel as well.
    this.join(this._mainChannel, true);
    this.updateOnlineUsers();
    initMessageChannels.push(this._mainChannel);

    //we use a specific user channel for notification
    this.join(this.sender.id);
    initMessageChannels.push(this.sender.id);
    return this.safeMultiplexMessageObservable(initMessageChannels);
  }

  isAvailable() {
    let available: boolean = true;
    try {
      if (!PubNub) {
        available = false;
      }
    } catch (e) {
      if (e instanceof ReferenceError) {
        available = false;
      }
    }
    return available;
  }

  initChannelTyping(channel: string, parent: Subscription): Subject<[string, boolean]> {
    let typing = new Subject<[string, boolean]>();
    let typingSubscription = this._presenceSubject.pipe(
      filter((m) => m.channel === channel && m.uuid !== this.sender.id),
      map(({ uuid, action, state }) => {
        switch (action) {
          case 'leave':
          case 'timeout':
            return [uuid, false];
          case 'join':
          case 'state-change':
            return [uuid, isObject(state) && state.isTyping === 'true'];
        }
      })
    ).subscribe(typing);
    parent.add(typing);
    parent.add(typingSubscription);
    return typing;
  }

  join(channel: string, withPresence = false, withTyping = false): Observable<Message> {
    if (!this._channels[channel] || this._channels[channel].subscription.closed) {
      let messages = new Subject<Message>();
      if (this._messageSubject) {
        let subscription = this._messageSubject.pipe(
          filter(m => m.channel === channel),
          map((m) => m.message)
        ).subscribe(messages);
        subscription.add(messages);
        let typing;
        if (withTyping) {
          typing = this.initChannelTyping(channel, subscription);
        }
        this._parentSubscription.add(subscription);
        this._channels[channel] = { messages, subscription, typing };
      }
      if (this.pubnub) {
        this.pubnub.subscribe({ channels: [channel], withPresence: withPresence || withTyping });
      }
    }
    if (this._channels && this._channels[channel] && this._channels[channel].messages) {
      return this._channels[channel].messages;
    } else {
      return new Subject<Message>();
    }
  }

  leave(channel: string) {
    if (channel && this._channels[channel]) {
      this._channels[channel].subscription.unsubscribe();
      this.pubnub.unsubscribe({ channels: [channel] });
    }
  }

  publish(channel: string, message: Message) {
    this.pubnub.publish({ channel: channel, message: message });
  }

  isOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  updateOnlineUsers() {
    this.pubnub.hereNow({ channels: [this._mainChannel], includeUUIDs: true }).then((response: HereNowResponse<UUIDState<GlobalState>>) => {
      this.onlineUsers.clear();
      response.channels[this._mainChannel].occupants.forEach(occupant => {
        this.onlineUsers.set(occupant.uuid, occupant.state || {});
      });
    });
  }

  disconnect() {
    if (this.sender && this.sender.id && this.pubnub) {
      this.pubnub.unsubscribeAll();
      this.pubnub.removeAllListeners();
      this._channels = {};
      this.pubnub.stop();
    }
    if (this._parentSubscription) {
      this._parentSubscription.unsubscribe();
    }
    delete this._presenceSubject;
    delete this._messageSubject;
    delete this._statusSubject;
    delete this._parentSubscription;
  }

  safeMultiplexMessageObservable(channels: string[]): Observable<Message> {
    return new Observable<Message>(observer => {
      forEach(channels, (channel: string) => {
        this._parentSubscription.add(this._channels[channel].messages.subscribe(m => observer.next(m)));
      });
    });
  }
}

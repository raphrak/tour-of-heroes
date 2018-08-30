export interface PresenceEvent {
    action?: string;
    uuid?: string;
    timestamp?: number;
    occupancy?: number;
    state?: any;
    channel?: string;
    subscription?: string;
    timetoken?: number;
    userMetadata?: any;
    join?: Array<string>;
    timedout?: Array<string>;
    leave?: Array<string>;
    here_now_refresh?: boolean;
  }
  
  export interface MessageEvent {
    message?: any;
    channel?: string;
    subscription?: string;
    timetoken?: number;
    userMetadata?: any;
  }
  
  export interface StatusEvent {
    error?: boolean;
    statusCode?: number;
    category?: string;
    errorData?: any;
    // send back channel, channel groups that were affected by this operation
    affectedChannels?: Array<string>;
    affectedChannelGroups?: Array<string>;
  }
  
  export class PubnubSender {
    id: string;
    username: string;
    image: string;
    appTitle: string;
  
    constructor(id, username, image, appTitle = 'TOH') {
      this.id = id;
      this.username = username;
      this.image = image;
      this.appTitle = appTitle;
    }
  }
  
  export interface Message {
    channel: string;
    message: string;
    type?: string;
    sender_id?: string;
    sender_username?: string;
    receiver_id?: string;
    receiver_username?: string;
    isGroup?: boolean;
    groupName?: string;
    date_sent?: Date;
    options?: any;
    icon?: string;
    photo?: any;
  }
  
  export type ChannelState = any;
  
  export interface GlobalState {
    [channelName: string]: ChannelState;
  }
  
  export interface UUIDState<T> {
    uuid: string;
    state: T;
  }
  
  export interface ChannelStatus<T> {
    occupants?: Array<T>;
    occupancy: number;
  }
  
  export interface HereNowResponse<T> {
    totalChannels?: number;
    totalOccupancy?: number;
    channels?: {
      [channelName: string]: ChannelStatus<T>
    };
    uuids?: Array<T>;
  }
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface BroadcastMessage {
  type: string;
  payload?: any;
  error?: string;
  timestamp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BroadcastService implements OnDestroy {
  private channels = new Map<string, BroadcastChannel>();
  private messageSubjects = new Map<string, Subject<BroadcastMessage>>();

  constructor(private ngZone: NgZone) { }

  /**
   * Create or get a broadcast channel
   */
  createChannel(channelName: string): void {
    if (this.channels.has(channelName)) {
      return;
    }

    if (!('BroadcastChannel' in window)) {
      console.error('BroadcastChannel API not supported');
      return;
    }

    const channel = new BroadcastChannel(channelName);
    const subject = new Subject<BroadcastMessage>();

    // Listen for messages - run inside Angular zone
    channel.onmessage = (event) => {
      this.ngZone.run(() => {
        console.log(`[BroadcastChannel:${channelName}] Received:`, event.data);
        subject.next(event.data);
      });
    };

    this.channels.set(channelName, channel);
    this.messageSubjects.set(channelName, subject);

    console.log(`BroadcastChannel created: ${channelName}`);
  }

  /**
   * Listen to messages of a specific type
   */
  messagesOfType(channelName: string, type: string): Observable<BroadcastMessage> {
    if (!this.messageSubjects.has(channelName)) {
      this.createChannel(channelName);
    }

    const subject = this.messageSubjects.get(channelName)!;
    return subject.pipe(
      filter(message => message.type === type)
    );
  }

  /**
   * Listen to all messages on a channel
   */
  messages(channelName: string): Observable<BroadcastMessage> {
    if (!this.messageSubjects.has(channelName)) {
      this.createChannel(channelName);
    }

    return this.messageSubjects.get(channelName)!.asObservable();
  }

  /**
   * Send a message to a channel
   */
  publish(channelName: string, message: BroadcastMessage): void {
    const channel = this.channels.get(channelName);
    if (!channel) {
      console.error(`Channel ${channelName} not found`);
      return;
    }

    console.log(`[BroadcastChannel:${channelName}] Sending:`, message);
    channel.postMessage(message);
  }

  /**
   * Close a specific channel
   */
  closeChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    const subject = this.messageSubjects.get(channelName);

    if (channel) {
      channel.close();
      this.channels.delete(channelName);
      console.log(`BroadcastChannel closed: ${channelName}`);
    }

    if (subject) {
      subject.complete();
      this.messageSubjects.delete(channelName);
    }
  }

  /**
   * Close all channels
   */
  ngOnDestroy(): void {
    this.channels.forEach((channel, name) => {
      channel.close();
      console.log(`BroadcastChannel closed: ${name}`);
    });

    this.messageSubjects.forEach(subject => subject.complete());

    this.channels.clear();
    this.messageSubjects.clear();
  }
}

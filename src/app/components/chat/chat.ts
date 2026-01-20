// chat-page.component.ts
import { Component, signal, computed, effect, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../ui/card/card';
import { NavbarMain } from '../common/navbar-main/navbar-main';
import { FooterMain } from '../common/footer-main/footer-main';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  userId: string;
  userName: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  avatar?: string;
  online: boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, NavbarMain, FooterMain],
  templateUrl: './chat.html'
})
export class Chat {
  messagesContainer = viewChild<ElementRef>('messagesContainer');
  searchQuery = signal('');
  newMessage = signal('');
  selectedConversation = signal<Conversation | null>(null);

  // Mock conversations
  conversations = signal<Conversation[]>([
    {
      id: 'c1',
      userId: 'u2',
      userName: 'Sarah Johnson',
      lastMessage: 'See you at the field tomorrow!',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      unread: 2,
      online: true
    },
    {
      id: 'c2',
      userId: 'u3',
      userName: 'Mike Williams',
      lastMessage: 'Thanks for booking with us',
      timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
      unread: 0,
      online: true
    },
    {
      id: 'c3',
      userId: 'u4',
      userName: 'Emma Davis',
      lastMessage: 'Is the field still available?',
      timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
      unread: 0,
      online: false
    },
    {
      id: 'c4',
      userId: 'u5',
      userName: 'James Brown',
      lastMessage: 'Great game yesterday!',
      timestamp: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
      unread: 1,
      online: false
    }
  ]);

  // Messages for each conversation
  messagesMap = signal<Record<string, ChatMessage[]>>({
    'c1': [
      {
        id: 'm1',
        userId: 'u1',
        userName: 'You',
        message: 'Hi! Is the field available tomorrow at 3 PM?',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString()
      },
      {
        id: 'm2',
        userId: 'u2',
        userName: 'Sarah Johnson',
        message: 'Yes, it\'s available! Would you like to book it?',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString()
      },
      {
        id: 'm3',
        userId: 'u1',
        userName: 'You',
        message: 'Perfect! I\'ll book it for 2 hours.',
        timestamp: new Date(Date.now() - 20 * 60000).toISOString()
      },
      {
        id: 'm4',
        userId: 'u2',
        userName: 'Sarah Johnson',
        message: 'See you at the field tomorrow!',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString()
      }
    ],
    'c2': [
      {
        id: 'm5',
        userId: 'u3',
        userName: 'Mike Williams',
        message: 'Thanks for booking with us',
        timestamp: new Date(Date.now() - 60 * 60000).toISOString()
      }
    ]
  });

  // Computed filtered conversations
  filteredConversations = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.conversations();

    return this.conversations().filter(conv =>
      conv.userName.toLowerCase().includes(query) ||
      conv.lastMessage.toLowerCase().includes(query)
    );
  });

  // Current conversation messages
  currentMessages = computed(() => {
    const convId = this.selectedConversation()?.id;
    if (!convId) return [];
    return this.messagesMap()[convId] || [];
  });

  constructor() {
    // Auto-scroll to bottom when messages change
    effect(() => {
      if (this.currentMessages().length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  selectConversation(conv: Conversation) {
    this.selectedConversation.set(conv);
    // Mark as read
    this.conversations.update(convs =>
      convs.map(c => c.id === conv.id ? { ...c, unread: 0 } : c)
    );
  }

  getConversationClass(convId: string): string {
    const base = 'text-left';
    const selected = 'bg-primary/10 border-l-4 border-primary';
    return this.selectedConversation()?.id === convId ? `${base} ${selected}` : base;
  }

  getMessageBubbleClass(isCurrentUser: boolean): string {
    return isCurrentUser
      ? 'bg-primary text-background-dark rounded-2xl rounded-br-sm px-4 py-3 shadow-lg'
      : 'bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm';
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  }

  formatMessageTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage() {
    const message = this.newMessage().trim();
    if (!message || !this.selectedConversation()) return;

    const convId = this.selectedConversation()!.id;
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      userId: 'u1',
      userName: 'You',
      message,
      timestamp: new Date().toISOString()
    };

    // Add message to conversation
    this.messagesMap.update(map => ({
      ...map,
      [convId]: [...(map[convId] || []), newMsg]
    }));

    // Update conversation last message
    this.conversations.update(convs =>
      convs.map(c => c.id === convId ? { ...c, lastMessage: message, timestamp: newMsg.timestamp } : c)
    );

    this.newMessage.set('');

    // Simulate response
    setTimeout(() => {
      const responseMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        userId: this.selectedConversation()!.userId,
        userName: this.selectedConversation()!.userName,
        message: 'Thanks for your message! I\'ll get back to you soon.',
        timestamp: new Date().toISOString()
      };

      this.messagesMap.update(map => ({
        ...map,
        [convId]: [...(map[convId] || []), responseMsg]
      }));
    }, 1000);
  }

  scrollToBottom() {
    const container = this.messagesContainer()?.nativeElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
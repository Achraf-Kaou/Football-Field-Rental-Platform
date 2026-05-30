// services/translation.service.ts
import { Injectable } from '@angular/core';

export type Language = 'en' | 'ar' | 'fr' | 'es';

interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private translations: Translations = {
    chatbot: {
      en: 'Chatbot',
      ar: 'المساعد الآلي',
      fr: 'Chatbot',
      es: 'Chatbot'
    },
    online: {
      en: 'Online',
      ar: 'متصل',
      fr: 'En ligne',
      es: 'En línea'
    },
    chatbotWelcome: {
      en: 'Hello! How can I assist you today?',
      ar: 'مرحباً! كيف يمكنني مساعدتك اليوم؟',
      fr: 'Bonjour! Comment puis-je vous aider aujourd\'hui?',
      es: '¡Hola! ¿Cómo puedo ayudarte hoy?'
    },
    typeMessage: {
      en: 'Type a message...',
      ar: 'اكتب رسالة...',
      fr: 'Tapez un message...',
      es: 'Escribe un mensaje...'
    },
    errorMessage: {
      en: 'Sorry, I encountered an error. Please try again.',
      ar: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',
      fr: 'Désolé, j\'ai rencontré une erreur. Veuillez réessayer.',
      es: 'Lo siento, encontré un error. Por favor, inténtalo de nuevo.'
    }
  };

  translate(key: string, language: Language): string {
    return this.translations[key]?.[language] || this.translations[key]?.['en'] || key;
  }

  getTranslations(language: Language): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(this.translations)) {
      result[key] = value[language] || value['en'];
    }
    
    return result;
  }
}
'use client';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    umami?: {
      track: (eventName: string, eventData?: Record<string, any>) => void;
    };
  }
}

export const useAnalytics = () => {
  const trackEvent = (action: string, category: string, label: string, value?: number) => {
    if (typeof window !== 'undefined') {
      // Google Analytics
      if (window.gtag) {
        window.gtag('event', action, {
          event_category: category,
          event_label: label,
          value: value
        });
      }

      // Umami Analytics
      if (window.umami) {
        window.umami.track(action, {
          category,
          label,
          value
        });
      }
    }
  };

  const trackPageView = (url: string) => {
    if (typeof window !== 'undefined') {
      // Google Analytics
      if (window.gtag) {
        window.gtag('config', process.env.NEXT_PUBLIC_GA_ID!, {
          page_path: url
        });
      }

      // Umami automatically tracks page views, but we can manually track if needed
      // Umami tracks page views automatically via the script
    }
  };

  // Umami-specific event tracking
  const trackUmamiEvent = (eventName: string, eventData?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.umami) {
      window.umami.track(eventName, eventData);
    }
  };

  return {
    trackEvent,
    trackPageView,
    trackUmamiEvent
  };
}; 
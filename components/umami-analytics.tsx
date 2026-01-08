'use client';

import Script from 'next/script';

const NEXT_PUBLIC_UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
const NEXT_PUBLIC_UMAMI_URL = process.env.NEXT_PUBLIC_UMAMI_URL || 'https://umami.is';

export function UmamiAnalytics() {
  // 如果没有配置 Umami Website ID，则不加载 Umami
  if (!NEXT_PUBLIC_UMAMI_WEBSITE_ID) {
    return null;
  }

  return (
    <Script
      src={`${NEXT_PUBLIC_UMAMI_URL}/script.js`}
      data-website-id={NEXT_PUBLIC_UMAMI_WEBSITE_ID}
      strategy="afterInteractive"
    />
  );
}


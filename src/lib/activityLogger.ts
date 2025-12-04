import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

type ActivityAction = 
  | 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'PASSWORD_RESET_REQUEST' | 'PASSWORD_RESET_COMPLETE' | 'PASSWORD_CHANGE'
  | 'PRODUCT_VIEW' | 'PRODUCT_SEARCH' | 'CATEGORY_VIEW'
  | 'CART_VIEW' | 'CART_ADD' | 'CART_REMOVE' | 'CART_UPDATE' | 'CART_CLEAR'
  | 'WISHLIST_VIEW' | 'WISHLIST_ADD' | 'WISHLIST_REMOVE'
  | 'ORDER_CREATE' | 'ORDER_VIEW' | 'ORDER_CANCEL' | 'CHECKOUT_START' | 'CHECKOUT_COMPLETE'
  | 'PAYMENT_INITIATED' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED'
  | 'ADDRESS_VIEW' | 'ADDRESS_ADD' | 'ADDRESS_UPDATE' | 'ADDRESS_DELETE' | 'ADDRESS_SET_DEFAULT'
  | 'PROFILE_VIEW' | 'PROFILE_UPDATE' | 'EMAIL_CHANGE' | 'PHONE_CHANGE'
  | 'REVIEW_ADD' | 'REVIEW_UPDATE' | 'REVIEW_DELETE'
  | 'ADMIN_LOGIN' | 'ADMIN_LOGOUT'
  | 'ADMIN_PRODUCT_CREATE' | 'ADMIN_PRODUCT_UPDATE' | 'ADMIN_PRODUCT_DELETE' | 'ADMIN_PRODUCT_BULK_DELETE'
  | 'ADMIN_CATEGORY_CREATE' | 'ADMIN_CATEGORY_UPDATE' | 'ADMIN_CATEGORY_DELETE'
  | 'ADMIN_ORDER_VIEW' | 'ADMIN_ORDER_UPDATE_STATUS' | 'ADMIN_ORDER_CANCEL'
  | 'ADMIN_CUSTOMER_VIEW' | 'ADMIN_CUSTOMER_UPDATE' | 'ADMIN_CUSTOMER_DELETE' | 'ADMIN_CUSTOMER_ROLE_CHANGE'
  | 'ADMIN_OFFER_CREATE' | 'ADMIN_OFFER_UPDATE' | 'ADMIN_OFFER_DELETE'
  | 'ADMIN_REVIEW_APPROVE' | 'ADMIN_REVIEW_REJECT' | 'ADMIN_REVIEW_DELETE'
  | 'ADMIN_SETTINGS_UPDATE' | 'ADMIN_STATS_VIEW' | 'ADMIN_LOGS_VIEW'
  | 'PAGE_VIEW' | 'FILE_DOWNLOAD' | 'FILE_UPLOAD' | 'CONTACT_FORM_SUBMIT' | 'NEWSLETTER_SUBSCRIBE'
  | 'ERROR_OCCURRED';

type ActivityCategory = 
  | 'AUTH' | 'PRODUCT' | 'CART' | 'WISHLIST' | 'ORDER' | 'PAYMENT' 
  | 'ADDRESS' | 'PROFILE' | 'REVIEW' | 'ADMIN' | 'SYSTEM' | 'ERROR';

interface LogActivityOptions {
  userId: string;
  action: ActivityAction;
  category: ActivityCategory;
  description: string;
  metadata?: Record<string, any>;
  request?: NextRequest;
  statusCode?: number;
  errorMessage?: string;
  duration?: number;
}

/**
 * IP adresini request'ten çıkarır
 */
function getIpAddress(request?: NextRequest): string | null {
  if (!request) return null;

  // Vercel, Cloudflare veya nginx gibi proxy'ler için
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // İlk IP adresi gerçek client IP'sidir
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  // Cloudflare
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  return null;
}

/**
 * Port bilgisini request'ten çıkarır
 */
function getPort(request?: NextRequest): string | null {
  if (!request) return null;

  // X-Forwarded-Port header'ından al
  const forwardedPort = request.headers.get('x-forwarded-port');
  if (forwardedPort) return forwardedPort;

  // Host header'ından port çıkar (örn: localhost:3000)
  const host = request.headers.get('host');
  if (host && host.includes(':')) {
    const port = host.split(':')[1];
    return port;
  }

  // HTTPS ise 443, HTTP ise 80 varsayılan
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  return protocol === 'https' ? '443' : '80';
}

/**
 * User agent bilgisini parse eder
 */
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  
  // Cihaz tespiti
  let device = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    device = 'tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    device = 'mobile';
  }

  // Tarayıcı tespiti
  let browser = 'unknown';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/')) browser = 'Chrome';
  else if (ua.includes('safari/') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('msie') || ua.includes('trident/')) browser = 'Internet Explorer';
  else if (ua.includes('opera') || ua.includes('opr/')) browser = 'Opera';

  // İşletim sistemi tespiti
  let os = 'unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { device, browser, os };
}

/**
 * Aktivite loglar (Non-blocking, performans için fire-and-forget)
 */
export function logActivity(options: LogActivityOptions): void {
  // Promise'i beklemeden fire-and-forget şeklinde çalıştır
  // Bu sayede loglama işlemi ana akışı yavaşlatmaz
  setImmediate(async () => {
    try {
      const {
        userId,
        action,
        category,
        description,
        metadata,
        request,
        statusCode,
        errorMessage,
        duration,
      } = options;

      const ipAddress = request ? getIpAddress(request) : null;
      const port = request ? getPort(request) : null;
      const userAgent = request?.headers.get('user-agent') || null;
      const referer = request?.headers.get('referer') || null;

      let device = null;
      let browser = null;
      let os = null;

      if (userAgent) {
        const parsed = parseUserAgent(userAgent);
        device = parsed.device;
        browser = parsed.browser;
        os = parsed.os;
      }

      await prisma.activityLog.create({
        data: {
          userId,
          action,
          category,
          description,
          metadata: metadata ? JSON.stringify(metadata) : null,
          ipAddress,
          port,
          userAgent,
          device,
          browser,
          os,
          referer,
          statusCode,
          errorMessage,
          duration,
        },
      });

      console.log(`✅ Activity logged: ${action} by user ${userId}`);
    } catch (error) {
      // Loglama hatası sessizce yutulur, uygulamayı etkilememeli
      console.error('❌ Failed to log activity:', error);
    }
  });
}

/**
 * Kullanıcı aktivite loglarını getirir
 */
export async function getUserActivityLogs(userId: string, options?: {
  limit?: number;
  offset?: number;
  category?: ActivityCategory;
  action?: ActivityAction;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = { userId };

  if (options?.category) {
    where.category = options.category;
  }

  if (options?.action) {
    where.action = options.action;
  }

  if (options?.startDate || options?.endDate) {
    where.createdAt = {};
    if (options.startDate) {
      where.createdAt.gte = options.startDate;
    }
    if (options.endDate) {
      where.createdAt.lte = options.endDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    logs: logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    })),
    total,
  };
}

/**
 * Aktivite istatistikleri
 */
export async function getUserActivityStats(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const logs = await prisma.activityLog.findMany({
    where: {
      userId,
      createdAt: { gte: startDate },
    },
    select: {
      category: true,
      action: true,
      createdAt: true,
      device: true,
      browser: true,
    },
  });

  // Kategori bazında sayılar
  const categoryStats = logs.reduce((acc, log) => {
    acc[log.category] = (acc[log.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Cihaz bazında sayılar
  const deviceStats = logs.reduce((acc, log) => {
    if (log.device) {
      acc[log.device] = (acc[log.device] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Tarayıcı bazında sayılar
  const browserStats = logs.reduce((acc, log) => {
    if (log.browser) {
      acc[log.browser] = (acc[log.browser] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Günlük aktivite
  const dailyActivity = logs.reduce((acc, log) => {
    const date = new Date(log.createdAt).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // En çok yapılan işlemler
  const topActions = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topActionsList = Object.entries(topActions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([action, count]) => ({ action, count }));

  return {
    totalActivities: logs.length,
    categoryStats,
    deviceStats,
    browserStats,
    dailyActivity,
    topActions: topActionsList,
  };
}

import prisma from '@/lib/prisma';

interface WebhookLogData {
  source: string; // 'geliver', 'parampos', etc.
  event: string; // Event type
  method: string; // HTTP method
  url: string;
  headers?: Record<string, string | string[] | undefined>;
  requestBody?: string | object;
  responseStatus?: number;
  responseBody?: string | object;
  orderId?: string;
  shipmentId?: string;
  transactionId?: string;
  isSuccess: boolean;
  errorMessage?: string;
  processingTime?: number;
  ipAddress?: string;
  userAgent?: string;
  signature?: string;
  isSignatureValid?: boolean;
}

/**
 * Webhook isteğini veritabanına loglar
 */
export async function logWebhook(data: WebhookLogData) {
  try {
    const log = await prisma.webhookLog.create({
      data: {
        source: data.source,
        event: data.event,
        method: data.method,
        url: data.url,
        headers: data.headers ? JSON.stringify(data.headers, null, 2) : null,
        requestBody: typeof data.requestBody === 'string' 
          ? data.requestBody 
          : JSON.stringify(data.requestBody, null, 2),
        responseStatus: data.responseStatus,
        responseBody: typeof data.responseBody === 'string'
          ? data.responseBody
          : JSON.stringify(data.responseBody, null, 2),
        orderId: data.orderId,
        shipmentId: data.shipmentId,
        transactionId: data.transactionId,
        isProcessed: true,
        isSuccess: data.isSuccess,
        errorMessage: data.errorMessage,
        processingTime: data.processingTime,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        signature: data.signature,
        isSignatureValid: data.isSignatureValid,
      },
    });

    console.log(`✅ Webhook logged: ${data.source}/${data.event} - ID: ${log.id}`);
    return log;
  } catch (error: any) {
    console.error('❌ Failed to log webhook:', error);
    // Loglama hatası uygulamayı durdurmasın
    return null;
  }
}

/**
 * Webhook loglarını sorgula
 */
export async function getWebhookLogs(filters?: {
  source?: string;
  event?: string;
  orderId?: string;
  shipmentId?: string;
  isSuccess?: boolean;
  limit?: number;
  offset?: number;
}) {
  try {
    const where: any = {};
    
    if (filters?.source) where.source = filters.source;
    if (filters?.event) where.event = filters.event;
    if (filters?.orderId) where.orderId = filters.orderId;
    if (filters?.shipmentId) where.shipmentId = filters.shipmentId;
    if (filters?.isSuccess !== undefined) where.isSuccess = filters.isSuccess;

    const logs = await prisma.webhookLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    const total = await prisma.webhookLog.count({ where });

    return {
      logs,
      total,
      hasMore: total > (filters?.offset || 0) + logs.length,
    };
  } catch (error: any) {
    console.error('Error fetching webhook logs:', error);
    return { logs: [], total: 0, hasMore: false };
  }
}

/**
 * Belirli bir webhook log detayını getir
 */
export async function getWebhookLog(id: string) {
  try {
    return await prisma.webhookLog.findUnique({
      where: { id },
    });
  } catch (error: any) {
    console.error('Error fetching webhook log:', error);
    return null;
  }
}

/**
 * Başarısız webhook'ları tekrar işle
 */
export async function retryFailedWebhook(id: string) {
  try {
    const log = await prisma.webhookLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new Error('Webhook log not found');
    }

    // Retry count artır
    await prisma.webhookLog.update({
      where: { id },
      data: {
        retryCount: log.retryCount + 1,
        lastRetryAt: new Date(),
      },
    });

    return log;
  } catch (error: any) {
    console.error('Error retrying webhook:', error);
    throw error;
  }
}

/**
 * Eski webhook loglarını temizle (90 günden eski)
 */
export async function cleanOldWebhookLogs(daysToKeep: number = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.webhookLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(`🧹 Cleaned ${result.count} old webhook logs`);
    return result.count;
  } catch (error: any) {
    console.error('Error cleaning old webhook logs:', error);
    return 0;
  }
}

/**
 * Webhook istatistikleri
 */
export async function getWebhookStats(source?: string, days: number = 7) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: any = {
      createdAt: { gte: since },
    };
    if (source) where.source = source;

    const [total, success, failed, byEvent] = await Promise.all([
      prisma.webhookLog.count({ where }),
      prisma.webhookLog.count({ where: { ...where, isSuccess: true } }),
      prisma.webhookLog.count({ where: { ...where, isSuccess: false } }),
      prisma.webhookLog.groupBy({
        by: ['event'],
        where,
        _count: { event: true },
        orderBy: { _count: { event: 'desc' } },
      }),
    ]);

    return {
      total,
      success,
      failed,
      successRate: total > 0 ? ((success / total) * 100).toFixed(2) : '0',
      byEvent: byEvent.map(e => ({
        event: e.event,
        count: e._count.event,
      })),
    };
  } catch (error: any) {
    console.error('Error getting webhook stats:', error);
    return {
      total: 0,
      success: 0,
      failed: 0,
      successRate: '0',
      byEvent: [],
    };
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyGeliverWebhook } from '@/lib/geliver';
import { logActivity } from '@/lib/activityLogger';
import fs from 'fs';
import path from 'path';

// Webhook'ları dosyaya kaydet
async function saveWebhookToFile(data: any) {
  try {
    const logsDir = path.join(process.cwd(), 'webhook-logs');
    
    // Klasör yoksa oluştur
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const eventName = data.event || 'unknown';
    const filename = `geliver-${eventName}-${timestamp}.json`;
    const filepath = path.join(logsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Webhook saved: webhook-logs/${filename}`);
  } catch (error) {
    console.error('❌ Failed to save webhook to file:', error);
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let requestBody = '';
  let parsedEvent: any = null;
  
  try {
    // Read raw body
    requestBody = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Parse webhook event
    try {
      parsedEvent = JSON.parse(requestBody);
    } catch (parseError: any) {
      const errorMessage = `Invalid JSON: ${parseError.message}`;
      
      // Hatalı webhook'u dosyaya kaydet
      await saveWebhookToFile({
        timestamp: new Date().toISOString(),
        event: 'PARSE_ERROR',
        success: false,
        error: errorMessage,
        headers,
        rawBody: requestBody,
        parsedBody: null,
        ipAddress,
        userAgent,
        processingTime: Date.now() - startTime,
        response: { error: errorMessage, status: 400 }
      });

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    console.log('Geliver webhook received:', parsedEvent.event);

    // Verify webhook signature (production'da true olmalı!)
    const isProduction = process.env.NODE_ENV === 'production';
    const signature = headers['x-geliver-signature'] || headers['signature'];
    const isSignatureValid = verifyGeliverWebhook(requestBody, headers, isProduction);

    if (!isSignatureValid && isProduction) {
      const errorMessage = 'Invalid webhook signature';
      console.error(errorMessage);
      
      // Signature hatası webhook'unu dosyaya kaydet
      await saveWebhookToFile({
        timestamp: new Date().toISOString(),
        event: parsedEvent.event || 'UNKNOWN',
        success: false,
        error: errorMessage,
        headers,
        rawBody: requestBody,
        parsedBody: parsedEvent,
        ipAddress,
        userAgent,
        signature: signature as string,
        isSignatureValid: false,
        processingTime: Date.now() - startTime,
        response: { error: errorMessage, status: 400 }
      });

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    let result: any = { success: true };
    let orderId: string | undefined;
    let shipmentId: string | undefined;
    let errorMessage: string | undefined;
    let isSuccess = true;

    // Handle different event types
    try {
      if (parsedEvent.event === 'TRACK_UPDATED') {
        result = await handleTrackingUpdate(parsedEvent.data);
        orderId = result.orderId;
        shipmentId = parsedEvent.data?.shipmentId;
      } else if (parsedEvent.event === 'SHIPMENT_CREATED') {
        result = await handleShipmentCreated(parsedEvent.data);
        orderId = result.orderId;
        shipmentId = parsedEvent.data?.shipmentId;
      } else if (parsedEvent.event === 'LABEL_READY') {
        result = await handleLabelReady(parsedEvent.data);
        orderId = result.orderId;
        shipmentId = parsedEvent.data?.shipmentId;
      } else {
        console.log('Unhandled webhook event:', parsedEvent.event);
        result = { success: true, message: 'Event acknowledged but not handled' };
      }
    } catch (handlerError: any) {
      isSuccess = false;
      errorMessage = handlerError.message;
      result = { success: false, error: errorMessage };
    }

    const processingTime = Date.now() - startTime;
    const responseStatus = isSuccess ? 200 : 500;
    const responseBody = { 
      success: isSuccess, 
      message: isSuccess ? 'Webhook processed' : 'Webhook processing failed',
      ...result 
    };

    // Webhook'u dosyaya kaydet
    await saveWebhookToFile({
      timestamp: new Date().toISOString(),
      event: parsedEvent.event,
      success: isSuccess,
      error: errorMessage || null,
      headers,
      rawBody: requestBody,
      parsedBody: parsedEvent,
      ipAddress,
      userAgent,
      signature: signature as string,
      isSignatureValid,
      orderId,
      shipmentId,
      processingTime,
      response: { body: responseBody, status: responseStatus }
    });

    return NextResponse.json(responseBody, { status: responseStatus });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    const errorMessage = error.message || 'Unknown error';
    const processingTime = Date.now() - startTime;

    // Kritik hata webhook'unu dosyaya kaydet
    try {
      await saveWebhookToFile({
        timestamp: new Date().toISOString(),
        event: parsedEvent?.event || 'UNKNOWN',
        success: false,
        error: errorMessage,
        headers: Object.fromEntries(req.headers.entries()),
        rawBody: requestBody,
        parsedBody: parsedEvent,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        processingTime,
        response: { error: 'Webhook processing failed', details: errorMessage, status: 500 }
      });
    } catch (logError) {
      console.error('Failed to save webhook error to file:', logError);
    }

    return NextResponse.json(
      { error: 'Webhook processing failed', details: errorMessage },
      { status: 500 }
    );
  }
}

async function handleTrackingUpdate(data: any) {
  try {
    const { shipmentId, trackingNumber, trackingUrl, trackingStatus } = data;

    // Find order by shipment ID
    const order = await prisma.order.findFirst({
      where: { geliverShipmentId: shipmentId },
    });

    if (!order) {
      console.log('Order not found for shipment:', shipmentId);
      return { success: false, orderId: null, message: 'Order not found' };
    }

    // Update order with tracking info
    const updateData: any = {};

    if (trackingNumber && trackingNumber !== order.cargoTrackingNumber) {
      updateData.cargoTrackingNumber = trackingNumber;
      updateData.trackingNumber = trackingNumber;
    }

    if (trackingUrl && trackingUrl !== order.cargoTrackingUrl) {
      updateData.cargoTrackingUrl = trackingUrl;
    }

    // Update order status based on tracking status
    if (trackingStatus) {
      const statusCode = trackingStatus.trackingStatusCode;
      
      // Map Geliver tracking status to order status
      if (statusCode === 'DELIVERED' && order.orderStatus !== 'DELIVERED') {
        updateData.orderStatus = 'DELIVERED';
      } else if (statusCode === 'IN_TRANSIT' && order.orderStatus === 'PROCESSING') {
        updateData.orderStatus = 'SHIPPED';
      } else if (statusCode === 'PICKED_UP' && order.orderStatus === 'PROCESSING') {
        updateData.orderStatus = 'SHIPPED';
      }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.order.update({
        where: { id: order.id },
        data: updateData,
      });

      await logActivity({
        action: 'WEBHOOK_TRACKING_UPDATE',
        description: `Kargo takip bilgisi güncellendi: ${order.orderNumber}. Takip No: ${trackingNumber || 'N/A'}`,
      });

      console.log('Order updated with tracking info:', order.orderNumber);
    }

    return { success: true, orderId: order.id, message: 'Tracking updated' };
  } catch (error: any) {
    console.error('Handle tracking update error:', error);
    throw error;
  }
}

async function handleShipmentCreated(data: any) {
  try {
    const { shipmentId, orderNumber } = data;

    console.log('Shipment created webhook:', shipmentId, orderNumber);

    // Find order by order number
    const order = await prisma.order.findFirst({
      where: { orderNumber },
    });

    if (!order) {
      console.log('Order not found:', orderNumber);
      return { success: false, orderId: null, message: 'Order not found' };
    }

    // Update shipment ID if not already set
    if (!order.geliverShipmentId) {
      await prisma.order.update({
        where: { id: order.id },
        data: { geliverShipmentId: shipmentId },
      });

      await logActivity({
        action: 'WEBHOOK_SHIPMENT_CREATED',
        description: `Kargo gönderisi oluşturuldu: ${orderNumber}. Shipment ID: ${shipmentId}`,
      });
    }

    return { success: true, orderId: order.id, message: 'Shipment created' };
  } catch (error: any) {
    console.error('Handle shipment created error:', error);
    throw error;
  }
}

async function handleLabelReady(data: any) {
  try {
    const { shipmentId, labelUrl, responsiveLabelUrl, barcode } = data;

    console.log('Label ready webhook:', shipmentId);

    // Find order by shipment ID
    const order = await prisma.order.findFirst({
      where: { geliverShipmentId: shipmentId },
    });

    if (!order) {
      console.log('Order not found for shipment:', shipmentId);
      return { success: false, orderId: null, message: 'Order not found' };
    }

    // Update order with label info
    const updateData: any = {};

    if (labelUrl) updateData.cargoLabelUrl = labelUrl;
    if (responsiveLabelUrl) updateData.cargoResponsiveLabelUrl = responsiveLabelUrl;
    if (barcode) updateData.cargoBarcode = barcode;

    if (Object.keys(updateData).length > 0) {
      await prisma.order.update({
        where: { id: order.id },
        data: updateData,
      });

      await logActivity({
        action: 'WEBHOOK_LABEL_READY',
        description: `Kargo etiketi hazır: ${order.orderNumber}. Barkod: ${barcode || 'N/A'}`,
      });

      console.log('Order updated with label info:', order.orderNumber);
    }

    return { success: true, orderId: order.id, message: 'Label ready' };
  } catch (error: any) {
    console.error('Handle label ready error:', error);
    throw error;
  }
}

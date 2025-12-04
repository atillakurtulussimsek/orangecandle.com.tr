import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyGeliverWebhook } from '@/lib/geliver';
import { logActivity } from '@/lib/activityLogger';
import { logWebhook } from '@/lib/webhookLogger';

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
      
      // Log başarısız webhook
      await logWebhook({
        source: 'geliver',
        event: 'PARSE_ERROR',
        method: req.method,
        url: req.url,
        headers,
        requestBody,
        responseStatus: 400,
        responseBody: { error: errorMessage },
        isSuccess: false,
        errorMessage,
        processingTime: Date.now() - startTime,
        ipAddress,
        userAgent,
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
      
      // Log başarısız webhook
      await logWebhook({
        source: 'geliver',
        event: parsedEvent.event || 'UNKNOWN',
        method: req.method,
        url: req.url,
        headers,
        requestBody,
        responseStatus: 400,
        responseBody: { error: errorMessage },
        isSuccess: false,
        errorMessage,
        processingTime: Date.now() - startTime,
        ipAddress,
        userAgent,
        signature: signature as string,
        isSignatureValid: false,
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

    // Log webhook
    await logWebhook({
      source: 'geliver',
      event: parsedEvent.event,
      method: req.method,
      url: req.url,
      headers,
      requestBody,
      responseStatus,
      responseBody,
      orderId,
      shipmentId,
      isSuccess,
      errorMessage,
      processingTime,
      ipAddress,
      userAgent,
      signature: signature as string,
      isSignatureValid,
    });

    return NextResponse.json(responseBody, { status: responseStatus });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    const errorMessage = error.message || 'Unknown error';
    const processingTime = Date.now() - startTime;

    // Log kritik hata
    try {
      await logWebhook({
        source: 'geliver',
        event: parsedEvent?.event || 'UNKNOWN',
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(req.headers.entries()),
        requestBody,
        responseStatus: 500,
        responseBody: { error: 'Webhook processing failed', details: errorMessage },
        isSuccess: false,
        errorMessage,
        processingTime,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      });
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
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

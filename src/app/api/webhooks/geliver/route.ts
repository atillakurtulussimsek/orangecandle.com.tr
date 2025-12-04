import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyGeliverWebhook } from '@/lib/geliver';
import { logActivity } from '@/lib/activityLogger';

export async function POST(req: NextRequest) {
  try {
    // Read raw body
    const body = await req.text();
    const headers = Object.fromEntries(req.headers.entries());

    // Verify webhook signature (production'da true olmalı!)
    const isProduction = process.env.NODE_ENV === 'production';
    const isValid = verifyGeliverWebhook(body, headers, isProduction);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Parse webhook event
    const event = JSON.parse(body);
    console.log('Geliver webhook received:', event.event);

    // Handle different event types
    if (event.event === 'TRACK_UPDATED') {
      await handleTrackingUpdate(event.data);
    } else if (event.event === 'SHIPMENT_CREATED') {
      await handleShipmentCreated(event.data);
    } else if (event.event === 'LABEL_READY') {
      await handleLabelReady(event.data);
    } else {
      console.log('Unhandled webhook event:', event.event);
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
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
      return;
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
  } catch (error) {
    console.error('Handle tracking update error:', error);
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
      return;
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
  } catch (error) {
    console.error('Handle shipment created error:', error);
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
      return;
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
  } catch (error) {
    console.error('Handle label ready error:', error);
  }
}

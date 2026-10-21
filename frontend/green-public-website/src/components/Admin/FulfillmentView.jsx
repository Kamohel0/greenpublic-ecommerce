import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Package, 
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  MapPin,
  Calendar,
  User,
  Tag
} from "lucide-react";
import { getAdminOrders, updateOrderFulfillment } from "@/api/adminApi";
import Toast from "@/components/ui/Toast";

const FulfillmentView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [activeTab, setActiveTab] = useState('PLACED');
  
  const tabs = [
    { id: 'PLACED', label: 'New Orders', icon: Clock, color: 'blue' },
    { id: 'PACKAGING', label: 'Packaging', icon: Package, color: 'yellow' },
    { id: 'READY_FOR_HANDOFF', label: 'Ready for Courier', icon: Truck, color: 'purple' },
    { id: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: Package, color: 'green' },
  ];

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        fulfillmentStatus: activeTab,
        page: 0,
        size: 100,
        sortBy: 'createdAt',
        sortDirection: 'DESC'
      };
      
      const data = await getAdminOrders(params);
      setOrders(data.content || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setToast({ visible: true, message: 'Failed to load orders', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
    // Auto-refresh every 15 minutes
    const interval = setInterval(fetchOrders, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderFulfillment(orderId, newStatus);
      setToast({ visible: true, message: `Order updated to ${newStatus.replace(/_/g, ' ')}`, type: 'success' });
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      setToast({ visible: true, message: 'Failed to update order', type: 'error' });
    }
  };

  const handlePrintLabel = (order) => {
    const printWindow = window.open('', '', 'width=600,height=800');
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-ZA');
    const isPickup = order.deliveryMethod === 'pickup';
    const shippingName = `${order.shippingAddress?.name || order.customer?.name || order.guestEmail || 'Guest'} ${order.shippingAddress?.surname || order.customer?.surname || ''}`.trim();
    const shippingEmail = order.customer?.email || order.guestEmail || 'N/A';
    const shippingPhone = order.shippingAddress?.phoneNo || order.customer?.phoneNumber || shippingEmail;
    const addressLine1 = order.shippingAddress?.addressLine1 || '';
    const addressLine2 = order.shippingAddress?.addressLine2 || '';
    const city = order.shippingAddress?.city || '';
    const province = order.shippingAddress?.province || '';
    const postalCode = order.shippingAddress?.postalCode || '';
    const country = order.shippingAddress?.country || '';
    const companyName = order.shippingAddress?.companyName || '';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Shipping Label - ${order.orderNumber}</title>
          <style>
            @page { margin: 10mm; }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              padding: 15px;
              width: 100mm;
              height: 150mm;
            }
            .label-container {
              border: 3px solid #000;
              padding: 10px;
              height: 100%;
              box-sizing: border-box;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              margin-bottom: 10px;
            }
            .company-name {
              font-size: 18px;
              font-weight: bold;
              color: #8B5A2B;
              margin: 0;
            }
            .order-number {
              font-size: 24px;
              font-weight: bold;
              margin: 5px 0;
              letter-spacing: 2px;
            }
            .delivery-type {
              background: ${isPickup ? '#fff9c4' : '#e3f2fd'};
              padding: 8px;
              text-align: center;
              font-weight: bold;
              font-size: 16px;
              margin: 10px 0;
              border: 2px solid ${isPickup ? '#fbc02d' : '#2196f3'};
            }
            .address-block {
              margin: 15px 0;
              padding: 10px;
              border: 2px dashed #666;
            }
            .address-label {
              font-size: 11px;
              color: #666;
              margin-bottom: 5px;
            }
            .customer-name {
              font-size: 16px;
              font-weight: bold;
              margin: 5px 0;
            }
            .address-line {
              font-size: 14px;
              margin: 3px 0;
            }
            .phone {
              font-size: 14px;
              font-weight: bold;
              margin-top: 8px;
            }
            .special-instructions {
              background: #fff9c4;
              padding: 8px;
              margin-top: 10px;
              border: 1px solid #fbc02d;
              font-size: 12px;
            }
            .footer {
              position: absolute;
              bottom: 15px;
              left: 15px;
              right: 15px;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <div class="header">
              <p class="company-name">🌿 GREEN PUBLIC</p>
              <div class="order-number">${order.orderNumber}</div>
              <div style="font-size: 11px; color: #666;">${orderDate}</div>
            </div>
            
            <div class="delivery-type">
              ${isPickup ? '📦 PICKUP AT FNB BANK CITY' : '🚚 HOME DELIVERY'}
            </div>
            
            ${isPickup ? `
              <div class="address-block">
                <div class="address-label">CUSTOMER TO PICKUP:</div>
                <div class="customer-name">${shippingName}</div>
                ${companyName ? `<div class="address-line">${companyName}</div>` : ''}
                <div class="address-line">✉️ ${shippingEmail}</div>
                <div class="phone">📞 ${shippingPhone || 'N/A'}</div>
                <div style="margin-top: 10px; font-size: 12px; font-weight: bold;">
                  ⚠️ HOLD FOR CUSTOMER PICKUP
                </div>
              </div>
            ` : `
              <div class="address-block">
                <div class="address-label">DELIVER TO:</div>
                <div class="customer-name">${shippingName}</div>
                ${companyName ? `<div class="address-line">${companyName}</div>` : ''}
                <div class="address-line">${addressLine1}</div>
                ${addressLine2 ? `<div class="address-line">${addressLine2}</div>` : ''}
                <div class="address-line">${city}${city && province ? ', ' : ''}${province}</div>
                <div class="address-line">${postalCode}${country ? ` • ${country}` : ''}</div>
                <div class="address-line">✉️ ${shippingEmail}</div>
                <div class="phone">📞 ${shippingPhone || 'N/A'}</div>
              </div>
              
              ${order.shippingAddress?.specialInstructions ? `
                <div class="special-instructions">
                  <strong>⚠️ SPECIAL INSTRUCTIONS:</strong><br/>
                  ${order.shippingAddress.specialInstructions}
                </div>
              ` : ''}
            `}
            
            <div class="footer">
              Handle with Care • Fragile Items<br/>
              Contact: greenpublic@contact.com
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handlePrint = (order) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-ZA');
    const shippingName = `${order.shippingAddress?.name || order.customer?.name || order.guestEmail || 'Guest'} ${order.shippingAddress?.surname || order.customer?.surname || ''}`.trim();
    const shippingEmail = order.customer?.email || order.guestEmail || 'N/A';
    const shippingPhone = order.shippingAddress?.phoneNo || order.customer?.phoneNumber || shippingEmail;
    const addressLine1 = order.shippingAddress?.addressLine1 || '';
    const addressLine2 = order.shippingAddress?.addressLine2 || '';
    const city = order.shippingAddress?.city || '';
    const province = order.shippingAddress?.province || '';
    const postalCode = order.shippingAddress?.postalCode || '';
    const country = order.shippingAddress?.country || '';
    const companyName = order.shippingAddress?.companyName || '';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Packing Slip - ${order.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #8B5A2B; }
            .section { margin: 20px 0; }
            .section-title { font-weight: bold; margin-bottom: 10px; font-size: 14px; }
            .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f4f4f4; }
            .delivery-badge { display: inline-block; padding: 5px 10px; background: #e3f2fd; border-radius: 4px; font-weight: bold; }
            .pickup-badge { background: #fff9c4; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Green Public - Packing Slip</h1>
            <p>Order: ${order.orderNumber} | Date: ${orderDate}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Delivery Method:</div>
            <span class="${order.deliveryMethod === 'pickup' ? 'pickup-badge' : 'delivery-badge'} delivery-badge">
              ${order.deliveryMethod === 'pickup' ? '📦 PICKUP' : '🚚 DELIVERY'}
            </span>
          </div>
          
          <div class="section">
            <div class="section-title">Customer Information:</div>
            <p><strong>Name:</strong> ${shippingName}</p>
            ${companyName ? `<p><strong>Company:</strong> ${companyName}</p>` : ''}
            <p><strong>Email:</strong> ${shippingEmail}</p>
            <p><strong>Phone:</strong> ${shippingPhone || 'N/A'}</p>
          </div>
          
          ${order.deliveryMethod === 'delivery' ? `
            <div class="section">
              <div class="section-title">Delivery Address:</div>
              <p>${addressLine1}</p>
              ${addressLine2 ? `<p>${addressLine2}</p>` : ''}
              <p>${city}${city && province ? ', ' : ''}${province} ${postalCode}</p>
              ${country ? `<p>${country}</p>` : ''}
              ${order.shippingAddress?.specialInstructions ? `<p><strong>Special Instructions:</strong> ${order.shippingAddress.specialInstructions}</p>` : ''}
            </div>
          ` : ''}
          
          <div class="section">
            <div class="section-title">Items to Pack:</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style="width: 80px; text-align: center;">Quantity</th>
                  <th style="width: 30px; text-align: center;">✓</th>
                </tr>
              </thead>
              <tbody>
                ${order.items?.map(item => `
                  <tr>
                    <td>${item.productName}</td>
                    <td style="text-align: center; font-weight: bold;">${item.quantity}</td>
                    <td></td>
                  </tr>
                `).join('') || ''}
              </tbody>
            </table>
          </div>
          
          <div class="section" style="margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 20px;">
            <p><strong>Total Amount:</strong> R${(Number(order.totalAmount || 0) + Number(order.shippingCost || 0)).toFixed(2)}</p>
            <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
          </div>
          
          <div style="margin-top: 60px; font-size: 12px; color: #666;">
            <p>Packed by: __________________ Date: __________ Signature: __________________</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const getNextAction = (order) => {
    const status = order.fulfillmentStatus || 'PLACED';
    const isPickup = order.deliveryMethod === 'pickup';
    
    switch (status) {
      case 'PLACED':
        return {
          label: 'Start Packaging',
          nextStatus: 'PACKAGING',
          color: 'bg-blue-500 hover:bg-blue-600'
        };
      case 'PACKAGING':
        return {
          label: isPickup ? 'Ready for Pickup' : 'Ready for Courier',
          nextStatus: isPickup ? 'READY_FOR_PICKUP' : 'READY_FOR_HANDOFF',
          color: 'bg-green-500 hover:bg-green-600'
        };
      case 'READY_FOR_HANDOFF':
        return {
          label: 'Hand to Courier',
          nextStatus: 'HANDED_TO_COURIER',
          color: 'bg-purple-500 hover:bg-purple-600'
        };
      default:
        return null;
    }
  };

  const getOrderAge = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const hours = Math.floor((now - created) / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Warehouse Fulfillment</h1>
          <p className="text-gray-600">Quick order processing and packing management</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const orderCount = orders.length;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white shadow-lg scale-105 text-[#8B5A2B]'
                    : 'bg-white/60 hover:bg-white/80 text-gray-600'
                }`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
                {isActive && orderCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-[#8B5A2B] text-white text-xs rounded-full">
                    {orderCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-[#8B5A2B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <CheckCircle2 className="mx-auto mb-4 text-green-500" size={64} />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">All Clear!</h3>
            <p className="text-gray-600">No orders in this stage</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => {
              const nextAction = getNextAction(order);
              const isPickup = order.deliveryMethod === 'pickup';
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-2xl shadow-lg border-2 ${
                    isPickup ? 'border-yellow-200' : 'border-blue-200'
                  } overflow-hidden hover:shadow-xl transition-shadow`}
                >
                  {/* Card Header */}
                  <div className={`${isPickup ? 'bg-yellow-50' : 'bg-blue-50'} px-6 py-4 border-b`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isPickup ? (
                          <Package className="text-yellow-600" size={24} />
                        ) : (
                          <Truck className="text-blue-600" size={24} />
                        )}
                        <span className={`font-bold text-lg ${isPickup ? 'text-yellow-800' : 'text-blue-800'}`}>
                          {order.orderNumber}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar size={12} />
                        {getOrderAge(order.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    {/* Customer Info */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-start gap-2 mb-2">
                        <User className="text-gray-400 mt-0.5" size={16} />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {order.customer?.name || order.guestEmail || 'Guest'} {order.customer?.surname || ''}
                          </p>
                          {!isPickup && order.shippingAddress && (
                            <div className="flex items-start gap-1 mt-1 text-xs text-gray-600">
                              <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                              <p className="line-clamp-2">
                                {order.shippingAddress.street}, {order.shippingAddress.city}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 mb-2">ITEMS TO PACK:</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700 truncate flex-1">{item.productName}</span>
                            <span className="font-bold text-[#8B5A2B] ml-2">×{item.quantity}</span>
                          </div>
                        )) || <p className="text-gray-400 text-sm">No items</p>}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="mb-4 pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total:</span>
                        <span className="text-lg font-bold text-gray-900">
                          R{(Number(order.totalAmount || 0) + Number(order.shippingCost || 0)).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">Payment:</span>
                        <span className={`text-xs font-semibold ${
                          order.paymentStatus === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handlePrint(order)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-all"
                        >
                          <Printer size={16} />
                          Packing Slip
                        </button>
                        <button
                          onClick={() => handlePrintLabel(order)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-sm font-semibold transition-all"
                        >
                          <Tag size={16} />
                          Shipping Label
                        </button>
                      </div>
                      
                      {nextAction && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, nextAction.nextStatus)}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl font-semibold transition-all ${nextAction.color}`}
                        >
                          <span>{nextAction.label}</span>
                          <ChevronRight size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FulfillmentView;

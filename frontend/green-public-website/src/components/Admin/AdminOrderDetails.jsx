import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin, 
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Truck,
  CreditCard,
  Edit,
  Save
} from "lucide-react";
import { getAdminOrderById, markReadyForPickup, updateOrderStatus } from "@/api/adminApi";
import Toast from "@/components/ui/Toast";

const AdminOrderDetails = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    orderStatus: '',
    paymentStatus: '',
    shippingStatus: '',
    fulfillmentStatus: '',
    trackingNumber: '',
    internalNotes: ''
  });

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const data = await getAdminOrderById(orderId);
      setOrder(data);
      setEditData({
        orderStatus: data.status,
        paymentStatus: data.paymentStatus,
        shippingStatus: data.shippingStatus,
        fulfillmentStatus: data.fulfillmentStatus || 'PLACED',
        trackingNumber: data.trackingNumber || '',
        internalNotes: data.internalNotes || ''
      });
    } catch (error) {
      console.error("Error fetching order details:", error);
      setToast({ visible: true, message: 'Failed to load order details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateOrderStatus(orderId, editData);
      setToast({ visible: true, message: 'Order updated successfully', type: 'success' });
      setIsEditing(false);
      fetchOrderDetails();
    } catch (error) {
      console.error("Error updating order:", error);
      setToast({ visible: true, message: 'Failed to update order', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkReadyForPickup = async () => {
    try {
      setSaving(true);
      await markReadyForPickup(orderId);
      setToast({ visible: true, message: 'Pickup notification sent to customer', type: 'success' });
      fetchOrderDetails();
    } catch (error) {
      console.error("Error marking ready for pickup:", error);
      setToast({ visible: true, message: error?.response?.data?.message || 'Failed to mark ready for pickup', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#8B5A2B] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto mb-4 text-gray-400" size={64} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order not found</h2>
          <button
            onClick={() => navigate("/admin/orders")}
            className="mt-4 px-6 py-3 bg-[#8B5A2B] text-white rounded-xl font-semibold"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast({ visible: false, message: '', type: 'info' })}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin/orders")}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-4xl font-bold mb-2">Order {order.orderNumber}</h1>
                <p className="text-white/80">
                  Created {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all"
                >
                  <Edit size={20} />
                  Edit Order
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({
                        orderStatus: order.status,
                        paymentStatus: order.paymentStatus,
                        shippingStatus: order.shippingStatus,
                        fulfillmentStatus: order.fulfillmentStatus || 'PLACED',
                        trackingNumber: order.trackingNumber || '',
                        internalNotes: order.internalNotes || ''
                      });
                    }}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 rounded-xl font-semibold transition-all disabled:opacity-50"
                  >
                    <Save size={20} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Order Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
                  {isEditing ? (
                    <select
                      value={editData.orderStatus}
                      onChange={(e) => setEditData({...editData, orderStatus: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PAID">Paid</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="REFUNDED">Refunded</option>
                    </select>
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{order.status}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                  {isEditing ? (
                    <select
                      value={editData.paymentStatus}
                      onChange={(e) => setEditData({...editData, paymentStatus: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="FAILED">Failed</option>
                      <option value="REFUNDED">Refunded</option>
                      <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{order.paymentStatus}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Status</label>
                  {isEditing ? (
                    <select
                      value={editData.shippingStatus}
                      onChange={(e) => setEditData({...editData, shippingStatus: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20"
                    >
                      <option value="NOT_SHIPPED">Not Shipped</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="IN_TRANSIT">In Transit</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="FAILED_DELIVERY">Failed Delivery</option>
                    </select>
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{order.shippingStatus?.replace(/_/g, ' ')}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fulfillment Stage</label>
                  {isEditing ? (
                    <select
                      value={editData.fulfillmentStatus}
                      onChange={(e) => setEditData({...editData, fulfillmentStatus: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20"
                    >
                      <option value="PLACED">Placed</option>
                      <option value="PACKAGING">Packaging</option>
                      <option value="READY_FOR_HANDOFF">Ready For Handoff</option>
                      <option value="HANDED_TO_COURIER">Handed To Courier</option>
                      <option value="READY_FOR_PICKUP">Ready For Pickup</option>
                    </select>
                  ) : (
                    <p className="text-lg font-semibold text-gray-900">{(order.fulfillmentStatus || 'PLACED').replace(/_/g, ' ')}</p>
                  )}
                </div>
              </div>

              {order.deliveryMethod === 'pickup' && (
                <div className="mt-4">
                  <button
                    onClick={handleMarkReadyForPickup}
                    disabled={saving || order.fulfillmentStatus === 'READY_FOR_PICKUP'}
                    className="px-5 py-2.5 bg-[#8B5A2B] hover:bg-[#9C6B3C] text-white rounded-xl font-medium disabled:opacity-50"
                  >
                    {order.fulfillmentStatus === 'READY_FOR_PICKUP' ? 'Already Ready for Pickup' : 'Mark as Ready for Pickup'}
                  </button>
                </div>
              )}
              
              {/* Tracking Number */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tracking Number</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.trackingNumber}
                    onChange={(e) => setEditData({...editData, trackingNumber: e.target.value})}
                    placeholder="Enter tracking number"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20"
                  />
                ) : (
                  <p className="text-lg text-gray-900">{order.trackingNumber || 'No tracking number'}</p>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.productName}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className={`text-xs mt-1 ${item.lowStock ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        Remaining stock: {item.remainingStock ?? '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">R{item.price?.toFixed(2)} each</p>
                      <p className="font-semibold text-gray-900">R{item.total?.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Order Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>R{(order.totalAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping ({order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'})</span>
                  <span>R{(order.shippingCost || 0).toFixed(2)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-R{order.discountAmount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>R{((order.totalAmount || 0) + (order.shippingCost || 0) - (order.discountAmount || 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Internal Notes */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Internal Notes</h2>
              {isEditing ? (
                <textarea
                  value={editData.internalNotes}
                  onChange={(e) => setEditData({...editData, internalNotes: e.target.value})}
                  placeholder="Add internal notes (not visible to customer)"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20"
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {order.internalNotes || 'No internal notes'}
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Customer & Address */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <User className="text-[#8B5A2B]" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Customer</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">
                    {order.customer?.name} {order.customer?.surname}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  <a href={`mailto:${order.customer?.email}`} className="text-[#8B5A2B] hover:underline">
                    {order.customer?.email}
                  </a>
                </div>
                {order.customer?.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <a href={`tel:${order.customer?.phoneNumber}`} className="text-[#8B5A2B] hover:underline">
                      {order.customer?.phoneNumber}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                {order.deliveryMethod === 'pickup' ? (
                  <Package className="text-[#8B5A2B]" size={24} />
                ) : (
                  <Truck className="text-[#8B5A2B]" size={24} />
                )}
                <h2 className="text-xl font-bold text-gray-800">
                  {order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'} Details
                </h2>
              </div>
              
              {order.deliveryMethod === 'pickup' ? (
                <div className="space-y-2 text-gray-700">
                  <p className="font-semibold">Pickup Location:</p>
                  <p>FNB Bank City</p>
                  <p>158 Main Road, Bedfordview, 2008</p>
                  <p className="text-sm text-gray-600 mt-2">Monday - Friday: 9:00 AM - 5:00 PM</p>
                </div>
              ) : order.shippingAddress ? (
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">
                    {order.shippingAddress.name} {order.shippingAddress.surname}
                  </p>
                  {order.shippingAddress.companyName && (
                    <p className="text-gray-700">{order.shippingAddress.companyName}</p>
                  )}
                  <p className="text-gray-700">{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && (
                    <p className="text-gray-700">{order.shippingAddress.addressLine2}</p>
                  )}
                  <p className="text-gray-700">
                    {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}
                  </p>
                  <p className="text-gray-700">{order.shippingAddress.country}</p>
                  {order.shippingAddress.phoneNo && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                      <Phone size={16} className="text-gray-400" />
                      <span className="text-gray-700">{order.shippingAddress.phoneNo}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No address information</p>
              )}
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="text-[#8B5A2B]" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Payment</h2>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Method</span>
                  <span className="font-semibold text-gray-900">{order.paymentMethod}</span>
                </div>
                {order.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid At</span>
                    <span className="text-gray-900">{new Date(order.paidAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="text-[#8B5A2B]" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Timeline</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                {order.lastModifiedAt && (
                  <div>
                    <p className="text-gray-600">Last Modified</p>
                    <p className="font-medium text-gray-900">{new Date(order.lastModifiedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;

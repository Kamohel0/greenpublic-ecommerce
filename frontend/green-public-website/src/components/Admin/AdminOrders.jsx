import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  Eye, 
  Package, 
  Truck,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { getAdminOrders } from "@/api/adminApi";
import Toast from "@/components/ui/Toast";

const AdminOrders = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    paymentStatus: searchParams.get('paymentStatus') || '',
    shippingStatus: searchParams.get('shippingStatus') || '',
    fulfillmentStatus: searchParams.get('fulfillmentStatus') || '',
    deliveryMethod: searchParams.get('deliveryMethod') || '',
    search: searchParams.get('search') || '',
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: currentPage,
        size: 20,
        sortBy: 'createdAt',
        sortDirection: 'DESC'
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });
      
      const data = await getAdminOrders(params);
      setOrders(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setToast({ visible: true, message: 'Failed to load orders', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(0);
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(0);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-purple-100 text-purple-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusBadge = (status) => {
    const statusColors = {
      PENDING: 'bg-orange-100 text-orange-800',
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-purple-100 text-purple-800',
      PARTIALLY_REFUNDED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getShippingStatusBadge = (status) => {
    const statusColors = {
      NOT_SHIPPED: 'bg-gray-100 text-gray-800',
      SHIPPED: 'bg-blue-100 text-blue-800',
      IN_TRANSIT: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      FAILED_DELIVERY: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getFulfillmentBadge = (status) => {
    const statusColors = {
      PLACED: 'bg-gray-100 text-gray-800',
      PACKAGING: 'bg-yellow-100 text-yellow-800',
      READY_FOR_HANDOFF: 'bg-blue-100 text-blue-800',
      HANDED_TO_COURIER: 'bg-indigo-100 text-indigo-800',
      READY_FOR_PICKUP: 'bg-green-100 text-green-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

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
            <div>
              <h1 className="text-4xl font-bold mb-2">Orders Management</h1>
              <p className="text-white/80">{totalElements} total orders</p>
            </div>
            <button
              onClick={() => navigate("/admin")}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all duration-300"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter size={20} className="text-[#8B5A2B]" />
            <h2 className="text-xl font-bold text-gray-800">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search order #, email..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all"
              />
            </form>

            {/* Order Status */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all"
            >
              <option value="">All Order Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="REFUNDED">Refunded</option>
            </select>

            {/* Payment Status */}
            <select
              value={filters.paymentStatus}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all"
            >
              <option value="">All Payment Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="PARTIALLY_REFUNDED">Partially Refunded</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Shipping Status */}
            <select
              value={filters.shippingStatus}
              onChange={(e) => handleFilterChange('shippingStatus', e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all"
            >
              <option value="">All Shipping Status</option>
              <option value="NOT_SHIPPED">Not Shipped</option>
              <option value="SHIPPED">Shipped</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED_DELIVERY">Failed Delivery</option>
            </select>

            {/* Delivery Method */}
            <select
              value={filters.deliveryMethod}
              onChange={(e) => handleFilterChange('deliveryMethod', e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all"
            >
              <option value="">All Delivery Methods</option>
              <option value="delivery">Home Delivery</option>
              <option value="pickup">Pickup</option>
            </select>

            {/* Fulfillment Status */}
            <select
              value={filters.fulfillmentStatus}
              onChange={(e) => handleFilterChange('fulfillmentStatus', e.target.value)}
              className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#8B5A2B] focus:ring-2 focus:ring-[#8B5A2B]/20 transition-all"
            >
              <option value="">All Fulfillment Stages</option>
              <option value="PLACED">Placed</option>
              <option value="PACKAGING">Packaging</option>
              <option value="READY_FOR_HANDOFF">Ready For Handoff</option>
              <option value="HANDED_TO_COURIER">Handed To Courier</option>
              <option value="READY_FOR_PICKUP">Ready For Pickup</option>
            </select>
          </div>

          <button
            onClick={() => {
              setFilters({
                status: '',
                paymentStatus: '',
                shippingStatus: '',
                fulfillmentStatus: '',
                deliveryMethod: '',
                search: '',
              });
              setSearchParams(new URLSearchParams());
              setCurrentPage(0);
            }}
            className="text-sm text-[#8B5A2B] hover:underline"
          >
            Clear all filters
          </button>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#8B5A2B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600">No orders found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="w-28 px-3 py-3 text-left text-xs font-semibold text-gray-700">Order #</th>
                      <th className="w-48 px-3 py-3 text-left text-xs font-semibold text-gray-700">Customer</th>
                      <th className="w-24 px-3 py-3 text-left text-xs font-semibold text-gray-700">Date</th>
                      <th className="w-24 px-3 py-3 text-left text-xs font-semibold text-gray-700">Total</th>
                      <th className="w-28 px-3 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                      <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-gray-700">Payment</th>
                      <th className="w-28 px-3 py-3 text-left text-xs font-semibold text-gray-700">Shipping</th>
                      <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-gray-700">Fulfillment</th>
                      <th className="w-24 px-3 py-3 text-left text-xs font-semibold text-gray-700">Delivery</th>
                      <th className="w-24 px-3 py-3 text-left text-xs font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.map((order) => (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 py-3 text-xs font-medium text-gray-900 truncate">
                          {order.orderNumber}
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-xs">
                            <div className="font-medium text-gray-900 truncate">
                              {order.customer?.name} {order.customer?.surname}
                            </div>
                            <div className="text-gray-500 truncate">{order.customer?.email}</div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                        </td>
                        <td className="px-3 py-3 text-xs font-semibold text-gray-900">
                          R{(Number(order.totalAmount || 0) + Number(order.shippingCost || 0)).toFixed(2)}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadge(order.paymentStatus)}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getShippingStatusBadge(order.shippingStatus)}`}>
                            {order.shippingStatus?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFulfillmentBadge(order.fulfillmentStatus)}`}>
                            {(order.fulfillmentStatus || 'PLACED').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            {order.deliveryMethod === 'pickup' ? (
                              <Package size={14} />
                            ) : (
                              <Truck size={14} />
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#8B5A2B] hover:bg-[#9C6B3C] text-white rounded-lg text-xs font-medium transition-all duration-300"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600">
                  Showing {currentPage * 20 + 1} to {Math.min((currentPage + 1) * 20, totalElements)} of {totalElements} orders
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="px-4 py-2 text-sm font-medium text-gray-700">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;

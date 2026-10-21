import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ShoppingBag, 
  DollarSign, 
  Package, 
  Truck, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { getAdminStats, getInventoryOverview } from "@/api/adminApi";
import Toast from "@/components/ui/Toast";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getAdminStats();
      setStats(data);
      const stockData = await getInventoryOverview({ lowStockOnly: true });
      setLowStockItems(stockData || []);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      setToast({ visible: true, message: 'Failed to load statistics', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, bgColor, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <Icon className={color} size={24} />
        </div>
        <span className="text-3xl font-bold text-gray-800">{value}</span>
      </div>
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#8B5A2B] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Loading dashboard...</p>
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
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-white/80">Manage your e-commerce store</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Revenue Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Revenue Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Revenue"
              value={`R${stats?.totalRevenue?.toFixed(2) || '0.00'}`}
              icon={DollarSign}
              color="text-green-600"
              bgColor="bg-green-100"
            />
            <StatCard
              title="Today's Revenue"
              value={`R${stats?.todayRevenue?.toFixed(2) || '0.00'}`}
              icon={TrendingUp}
              color="text-blue-600"
              bgColor="bg-blue-100"
            />
            <StatCard
              title="This Month"
              value={`R${stats?.monthRevenue?.toFixed(2) || '0.00'}`}
              icon={DollarSign}
              color="text-purple-600"
              bgColor="bg-purple-100"
            />
          </div>
        </div>

        {/* Order Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Orders Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Orders"
              value={stats?.totalOrders || 0}
              icon={ShoppingBag}
              color="text-[#8B5A2B]"
              bgColor="bg-[#DAB6A2]/20"
            />
            <StatCard
              title="Pending Orders"
              value={stats?.pendingOrders || 0}
              icon={Clock}
              color="text-yellow-600"
              bgColor="bg-yellow-100"
            />
            <StatCard
              title="Completed Orders"
              value={stats?.completedOrders || 0}
              icon={CheckCircle}
              color="text-green-600"
              bgColor="bg-green-100"
            />
            <StatCard
              title="Cancelled Orders"
              value={stats?.cancelledOrders || 0}
              icon={XCircle}
              color="text-red-600"
              bgColor="bg-red-100"
            />
          </div>
        </div>

        {/* Payment & Shipping Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment & Shipping</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Paid Orders"
              value={stats?.paidOrders || 0}
              icon={CheckCircle}
              color="text-green-600"
              bgColor="bg-green-100"
            />
            <StatCard
              title="Unpaid Orders"
              value={stats?.unpaidOrders || 0}
              icon={AlertCircle}
              color="text-orange-600"
              bgColor="bg-orange-100"
            />
            <StatCard
              title="Orders to Ship"
              value={stats?.ordersToShip || 0}
              icon={Package}
              color="text-blue-600"
              bgColor="bg-blue-100"
            />
            <StatCard
              title="Orders Shipped"
              value={stats?.ordersShipped || 0}
              icon={Truck}
              color="text-indigo-600"
              bgColor="bg-indigo-100"
            />
          </div>
        </div>

        {/* Delivery Methods */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Delivery Methods</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              title="Home Delivery"
              value={stats?.deliveryOrders || 0}
              icon={Truck}
              color="text-[#8B5A2B]"
              bgColor="bg-[#DAB6A2]/20"
              subtitle="Via The Courier Guy"
            />
            <StatCard
              title="Pickup Orders"
              value={stats?.pickupOrders || 0}
              icon={Package}
              color="text-green-600"
              bgColor="bg-green-100"
              subtitle="FNB Bank City"
            />
          </div>
        </div>

        {/* Customers */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Customers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard
              title="Total Customers"
              value={stats?.totalCustomers || 0}
              icon={Users}
              color="text-purple-600"
              bgColor="bg-purple-100"
            />
            <StatCard
              title="Active Customers"
              value={stats?.activeCustomers || 0}
              icon={Users}
              color="text-green-600"
              bgColor="bg-green-100"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/admin/fulfillment")}
              className="px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Package size={20} />
               Warehouse Fulfillment
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/admin/orders")}
              className="px-6 py-4 bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              View All Orders
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/admin/orders?status=PENDING")}
              className="px-6 py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              View Pending Orders
            </motion.button>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Low Stock Alerts</h2>
          {lowStockItems.length === 0 ? (
            <p className="text-gray-600">No low-stock products right now.</p>
          ) : (
            <div className="space-y-2">
              {lowStockItems.slice(0, 8).map((item) => (
                <div key={item.productId} className="flex justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                  <span className="font-medium text-gray-800">{item.productName}</span>
                  <span className="text-red-600 font-semibold">Only {item.availableStock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

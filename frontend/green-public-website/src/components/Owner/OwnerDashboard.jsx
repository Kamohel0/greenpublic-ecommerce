import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Boxes, AlertTriangle, RefreshCw, Wallet, TrendingUp, Users, DollarSign } from "lucide-react";
import { getOwnerOverview } from "@/api/ownerApi";
import { updateInventoryStock } from "@/api/adminApi";
import Toast from "@/components/ui/Toast";

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingMap, setSavingMap] = useState({});
  const [editedStock, setEditedStock] = useState({});
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const data = await getOwnerOverview();
      setOverview(data);
      const draft = {};
      (data?.inventory || []).forEach((item) => {
        draft[item.productId] = item.stockQuantity;
      });
      setEditedStock(draft);
    } catch {
      setToast({ visible: true, message: "Failed to load owner dashboard", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const totalAvailableStock = useMemo(() => {
    return (overview?.inventory || []).reduce((sum, item) => sum + Number(item.availableStock || 0), 0);
  }, [overview]);

  const formatCurrency = (value) => `R${Number(value || 0).toFixed(2)}`;
  const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;

  const alerts = useMemo(() => {
    const stats = overview?.stats || {};
    const items = [];

    if ((overview?.lowStockItems?.length || 0) > 0) {
      items.push({ level: "High", text: `${overview.lowStockItems.length} products are low on stock` });
    }
    if ((stats.paymentFailedOrders || 0) > 0) {
      items.push({ level: "High", text: `${stats.paymentFailedOrders} payment(s) failed and need review` });
    }
    if ((stats.packagingBacklog || 0) > 10) {
      items.push({ level: "Medium", text: `Packaging backlog is ${stats.packagingBacklog} orders` });
    }
    if ((stats.revenueVsYesterdayPercent || 0) <= -20) {
      items.push({ level: "Medium", text: `Revenue is down ${Math.abs(stats.revenueVsYesterdayPercent).toFixed(1)}% vs yesterday` });
    }

    return items;
  }, [overview]);

  const saveStock = async (productId) => {
    try {
      setSavingMap((prev) => ({ ...prev, [productId]: true }));
      await updateInventoryStock(productId, Number(editedStock[productId] || 0));
      await fetchOverview();
      setToast({ visible: true, message: "Stock updated", type: "success" });
    } catch (error) {
      setToast({ visible: true, message: error?.response?.data?.message || "Failed to update stock", type: "error" });
    } finally {
      setSavingMap((prev) => ({ ...prev, [productId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#8B5A2B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast({ visible: false, message: "", type: "info" })}
      />

      <div className="bg-gradient-to-r from-[#8B5A2B] to-[#DAB6A2] text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Owner Dashboard</h1>
            <p className="text-white/80">Analytics, inventory, and low-stock control</p>
          </div>
          <button
            onClick={() => navigate("/admin")}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold"
          >
            Admin View
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2"><DollarSign size={18} /> Total Revenue</div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview?.stats?.totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2"><Wallet size={18} /> Today Revenue</div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview?.stats?.todayRevenue)}</p>
            <p className={`text-xs mt-1 ${(overview?.stats?.revenueVsYesterdayPercent || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatPercent(overview?.stats?.revenueVsYesterdayPercent)} vs yesterday
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2"><BarChart3 size={18} /> This Month</div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview?.stats?.monthRevenue)}</p>
            <p className={`text-xs mt-1 ${(overview?.stats?.revenueVsLastMonthPercent || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatPercent(overview?.stats?.revenueVsLastMonthPercent)} vs last month
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2"><TrendingUp size={18} /> Average Order Value</div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview?.stats?.averageOrderValue)}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2"><BarChart3 size={18} /> Today Orders</div>
            <p className="text-2xl font-bold text-gray-900">{overview?.stats?.todayOrders || 0}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2"><AlertTriangle size={18} /> Refund Rate</div>
            <p className="text-2xl font-bold text-gray-900">{formatPercent(overview?.stats?.refundRatePercent)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Profit & Cashflow</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Net Revenue</span><span className="font-semibold">{formatCurrency(overview?.stats?.netRevenue)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Paid Orders</span><span className="font-semibold">{overview?.stats?.paidOrders || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Pending Payments</span><span className="font-semibold">{overview?.stats?.pendingPaymentOrders || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Failed Payments</span><span className="font-semibold text-red-600">{overview?.stats?.paymentFailedOrders || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Refunded/Partial</span><span className="font-semibold text-amber-700">{overview?.stats?.refundedPaymentOrders || 0}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Customer Health</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Total Customers</span><span className="font-semibold">{overview?.stats?.totalCustomers || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">New This Month</span><span className="font-semibold">{overview?.stats?.newCustomersThisMonth || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Returning This Month</span><span className="font-semibold">{overview?.stats?.returningCustomersThisMonth || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Repeat Purchase Rate</span><span className="font-semibold">{formatPercent(overview?.stats?.repeatPurchaseRatePercent)}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Alerts Center</h2>
            {alerts.length === 0 ? (
              <p className="text-sm text-green-700">No critical alerts right now.</p>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert, index) => (
                  <div key={index} className="text-sm p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                    <span className="font-semibold">{alert.level}:</span> {alert.text}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-gray-200 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-600">Packaging Backlog</span><span className="font-semibold">{overview?.stats?.packagingBacklog || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Ready for Dispatch</span><span className="font-semibold">{overview?.stats?.readyForDispatch || 0}</span></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2"><BarChart3 size={18} /> All Orders</div>
            <p className="text-3xl font-bold text-gray-900">{overview?.stats?.totalOrders || 0}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2"><Boxes size={18} /> Total Available Stock</div>
            <p className="text-3xl font-bold text-gray-900">{totalAvailableStock}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-2"><Users size={18} /> Active Customers</div>
            <p className="text-3xl font-bold text-gray-900">{overview?.stats?.activeCustomers || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Inventory Management</h2>
            <button onClick={fetchOverview} className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center gap-2">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2">Product</th>
                  <th className="py-2">Available</th>
                  <th className="py-2">Reserved</th>
                  <th className="py-2">Stock Qty</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {(overview?.inventory || []).map((item) => (
                  <tr key={item.productId} className={`border-b ${item.lowStock ? "bg-red-50" : ""}`}>
                    <td className="py-2 font-medium text-gray-800">{item.productName}</td>
                    <td className={`py-2 ${item.lowStock ? "text-red-600 font-semibold" : "text-gray-700"}`}>{item.availableStock}</td>
                    <td className="py-2 text-gray-700">{item.reservedQuantity}</td>
                    <td className="py-2">
                      <input
                        type="number"
                        min="0"
                        value={editedStock[item.productId] ?? item.stockQuantity}
                        onChange={(e) => setEditedStock((prev) => ({ ...prev, [item.productId]: e.target.value }))}
                        className="w-28 px-2 py-1 border rounded-lg"
                      />
                    </td>
                    <td className="py-2">
                      <button
                        disabled={Boolean(savingMap[item.productId])}
                        onClick={() => saveStock(item.productId)}
                        className="px-3 py-1.5 text-xs bg-[#8B5A2B] hover:bg-[#9C6B3C] text-white rounded-lg disabled:opacity-50"
                      >
                        {savingMap[item.productId] ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;

import mongoose from "mongoose";
import { OrderModel } from "@/model/order-model";
import { ProductModel } from "@/model/product-model";
import { CustomerModel } from "@/model/customer-model";
import { dbConnect } from "@/service/mongo";

/**
 * Build a date-range match condition.
 * dateFrom / dateTo are "YYYY-MM-DD" strings (Bangladesh time).
 * If both are absent → no date filter (all-time).
 */
function buildDateMatch(dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return {};
  const cond = {};
  if (dateFrom) cond.$gte = new Date(dateFrom + "T00:00:00+06:00");
  if (dateTo)   cond.$lte = new Date(dateTo   + "T23:59:59+06:00");
  return { createdAt: cond };
}

export async function getDashboardData({ shopId, userId, dateFrom, dateTo }) {
  await dbConnect();
  if (!shopId || !userId) return getEmptyDashboard();

  // Cookie values are plain strings — convert to ObjectId for MongoDB $match
  let shopObjId, userObjId;
  try {
    shopObjId = new mongoose.Types.ObjectId(shopId);
    userObjId = new mongoose.Types.ObjectId(userId);
  } catch {
    return getEmptyDashboard();
  }

  const dateMatch = buildDateMatch(dateFrom, dateTo);

  const [
    orderStats,
    revenueStats,
    recentOrders,
    topProducts,
    dailySales,
    ordersByType,
    ordersByLocation,
    ordersByStatus,
    totalProducts,
    lowStockProducts,
    totalCustomers,
  ] = await Promise.all([
    getOrderStats(shopObjId, userObjId, dateMatch),
    getRevenueStats(shopObjId, userObjId, dateMatch),
    getRecentOrders(shopObjId, userObjId, dateMatch),
    getTopProducts(shopObjId, userObjId, dateMatch),
    getDailySales(shopObjId, userObjId, dateFrom, dateTo),
    getOrdersByType(shopObjId, userObjId, dateMatch),
    getOrdersByLocation(shopObjId, userObjId, dateMatch),
    getOrdersByStatus(shopObjId, userObjId, dateMatch),
    getProductStats(shopObjId, userObjId),
    getLowStockProducts(shopObjId, userObjId),
    getTotalCustomers(shopObjId, userObjId, dateMatch),
  ]);

  return JSON.parse(JSON.stringify({
    orderStats, revenueStats, recentOrders, topProducts,
    dailySales, ordersByType, ordersByLocation, ordersByStatus,
    totalProducts, lowStockProducts, totalCustomers,
    dateFrom: dateFrom || null,
    dateTo:   dateTo   || null,
  }));
}

/* ─── Order Status Counts ─────────────────────────────────────────────────── */
async function getOrderStats(shopId, userId, dateMatch) {
  const [r] = await OrderModel.aggregate([
    { $match: { shopId, userId, ...dateMatch } },
    { $facet: {
      total:     [{ $count: "n" }],
      confirmed: [{ $match: { status: "confirmed" } }, { $count: "n" }],
      pending:   [{ $match: { status: "pending"   } }, { $count: "n" }],
      shipped:   [{ $match: { status: "shipped"   } }, { $count: "n" }],
      delivered: [{ $match: { status: "delivered" } }, { $count: "n" }],
      cancelled: [{ $match: { status: "cancelled" } }, { $count: "n" }],
    }},
  ]);
  return {
    total:     r?.total[0]?.n     ?? 0,
    confirmed: r?.confirmed[0]?.n ?? 0,
    pending:   r?.pending[0]?.n   ?? 0,
    shipped:   r?.shipped[0]?.n   ?? 0,
    delivered: r?.delivered[0]?.n ?? 0,
    cancelled: r?.cancelled[0]?.n ?? 0,
  };
}

/* ─── Revenue / Financial Stats ──────────────────────────────────────────── */
async function getRevenueStats(shopId, userId, dateMatch) {
  const [r] = await OrderModel.aggregate([
    { $match: { shopId, userId, ...dateMatch } },
    { $group: {
      _id: null,
      totalRevenue:  { $sum: "$grand_total" },
      totalDiscount: { $sum: "$discount" },
      totalShipping: { $sum: "$shipping_cost" },
      totalAdvanced: { $sum: "$advanced" },
      totalDue:      { $sum: "$due" },
      avgOrderValue: { $avg: "$grand_total" },
    }},
  ]);
  return {
    totalRevenue:  r?.totalRevenue   ?? 0,
    totalDiscount: r?.totalDiscount  ?? 0,
    totalShipping: r?.totalShipping  ?? 0,
    totalAdvanced: r?.totalAdvanced  ?? 0,
    totalDue:      r?.totalDue       ?? 0,
    avgOrderValue: Math.round(r?.avgOrderValue ?? 0),
  };
}

/* ─── Recent Orders (latest 5) ───────────────────────────────────────────── */
async function getRecentOrders(shopId, userId, dateMatch) {
  const orders = await OrderModel.aggregate([
    { $match: { shopId, userId, ...dateMatch } },
    { $sort: { createdAt: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "customers",
        localField: "customer",
        foreignField: "_id",
        as: "customer",
      },
    },
    { $unwind: { path: "$customer", preserveNullAndEmpty: true } },
    {
      $project: {
        status: 1,
        grand_total: 1,
        discount: 1,
        shipping_cost: 1,
        orderType: 1,
        deliveryLocation: 1,
        createdAt: 1,
        "customer.customerName": 1,
        "customer.customerPhone": 1,
        "customer.customerAddress": 1,
      },
    },
  ]);
  return JSON.parse(JSON.stringify(orders));
}


/* ─── Top Selling Products ────────────────────────────────────────────────── */
async function getTopProducts(shopId, userId, dateMatch) {
  return OrderModel.aggregate([
    { $match: { shopId, userId, ...dateMatch } },
    { $unwind: "$productId" },
    { $group: { _id: "$productId", saleCount: { $sum: 1 }, revenue: { $sum: "$grand_total" } } },
    { $sort: { saleCount: -1 } },
    { $limit: 5 },
    { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "p" } },
    { $unwind: "$p" },
    { $project: { _id: 1, saleCount: 1, revenue: 1,
      productName: "$p.productName", mainImage: "$p.mainImage",
      regularPrice: "$p.regularPrice", availableQuantity: "$p.availableQuantity" } },
  ]);
}

/* ─── Daily Sales Chart (dynamic window) ─────────────────────────────────── */
async function getDailySales(shopId, userId, dateFrom, dateTo) {
  // Determine window: custom range or last 7 days
  const endDate   = dateTo   ? new Date(dateTo   + "T23:59:59+06:00") : new Date();
  const startDate = dateFrom ? new Date(dateFrom + "T00:00:00+06:00") : (() => {
    const d = new Date(); d.setDate(d.getDate() - 6); return d;
  })();

  const raw = await OrderModel.aggregate([
    { $match: { shopId, userId, createdAt: { $gte: startDate, $lte: endDate } } },
    { $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+06:00" } },
      orders:  { $sum: 1 },
      revenue: { $sum: "$grand_total" },
    }},
    { $sort: { _id: 1 } },
  ]);

  // Build day-by-day array filling gaps with 0
  const map = Object.fromEntries(raw.map((r) => [r._id, r]));
  const days = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split("T")[0];
    days.push({
      day: new Date(key).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      date: key,
      orders:  map[key]?.orders  ?? 0,
      revenue: map[key]?.revenue ?? 0,
    });
  }
  return days;
}

/* ─── Orders by Type ──────────────────────────────────────────────────────── */
async function getOrdersByType(shopId, userId, dateMatch) {
  const r = await OrderModel.aggregate([
    { $match: { shopId, userId, ...dateMatch } },
    { $group: { _id: "$orderType", count: { $sum: 1 } } },
  ]);
  const L = { website: "Website", landing: "Landing Page", manual: "Manual" };
  const C = { website: "#6366f1", landing: "#10b981", manual: "#f59e0b" };
  return r.map((x) => ({ name: L[x._id] ?? x._id, value: x.count, color: C[x._id] ?? "#94a3b8" }));
}

/* ─── Orders by Location ──────────────────────────────────────────────────── */
async function getOrdersByLocation(shopId, userId, dateMatch) {
  const r = await OrderModel.aggregate([
    { $match: { shopId, userId, ...dateMatch } },
    { $group: { _id: "$deliveryLocation", count: { $sum: 1 } } },
  ]);
  const L = { insideDhaka: "Inside Dhaka", outsideDhaka: "Outside Dhaka", cash: "Cash on Delivery" };
  const C = { insideDhaka: "#6366f1", outsideDhaka: "#10b981", cash: "#f59e0b" };
  return r.map((x) => ({ name: L[x._id] ?? x._id, value: x.count, color: C[x._id] ?? "#94a3b8" }));
}

/* ─── Orders by Status (for bar chart) ───────────────────────────────────── */
async function getOrdersByStatus(shopId, userId, dateMatch) {
  const statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
  const colors   = { pending: "#f59e0b", confirmed: "#10b981", shipped: "#6366f1", delivered: "#3b82f6", cancelled: "#ef4444" };
  const r = await OrderModel.aggregate([
    { $match: { shopId, userId, ...dateMatch } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(r.map((x) => [x._id, x.count]));
  return statuses.map((s) => ({ name: s.charAt(0).toUpperCase() + s.slice(1), value: map[s] ?? 0, color: colors[s] }));
}

/* ─── Product Stats (no date filter — all-time) ──────────────────────────── */
async function getProductStats(shopId, userId) {
  const [r] = await ProductModel.aggregate([
    { $match: { shopId, userId } },
    { $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: ["$isActive", 1, 0] } }, featured: { $sum: { $cond: ["$isFeatured", 1, 0] } } } },
  ]);
  return { total: r?.total ?? 0, active: r?.active ?? 0, featured: r?.featured ?? 0 };
}

/* ─── Low Stock ───────────────────────────────────────────────────────────── */
async function getLowStockProducts(shopId, userId) {
  const p = await ProductModel.find({ shopId, userId, availableQuantity: { $gt: 0, $lte: 5 } })
    .select("productName mainImage availableQuantity regularPrice")
    .sort({ availableQuantity: 1 }).limit(5).lean();
  return JSON.parse(JSON.stringify(p));
}

/* ─── Total Customers ─────────────────────────────────────────────────────── */
async function getTotalCustomers(shopId, userId, dateMatch) {
  const [r] = await OrderModel.aggregate([
    { $match: { shopId, userId, ...dateMatch } },
    { $group: { _id: "$customer" } },
    { $count: "total" },
  ]);
  return r?.total ?? 0;
}

/* ─── Empty state ─────────────────────────────────────────────────────────── */
function getEmptyDashboard() {
  return {
    orderStats: { total:0, confirmed:0, pending:0, shipped:0, delivered:0, cancelled:0 },
    revenueStats: { totalRevenue:0, totalDiscount:0, totalShipping:0, totalAdvanced:0, totalDue:0, avgOrderValue:0 },
    recentOrders: [], topProducts: [], dailySales: [],
    ordersByType: [], ordersByLocation: [], ordersByStatus: [],
    totalProducts: { total:0, active:0, featured:0 },
    lowStockProducts: [], totalCustomers: 0,
    dateFrom: null, dateTo: null,
  };
}

import {
  replaceMongoIdInArray,
  replaceMongoIdInObject,
} from "@/lib/convertData";
import { CustomerModel } from "@/model/customer-model";
import { OrderModel } from "@/model/order-model";
import { ProductModel } from "@/model/product-model";
import { dbConnect } from "@/service/mongo";
import mongoose from "mongoose";

async function orderQuery(data) {
  await dbConnect();

  const {
    userId,
    shopId,
    customerName,
    customerPhone,
    customerAddress,
    visitorId,
    customerNote,
    ...orderData
  } = data;

  if (!shopId) throw new Error("Shop ID is required");

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create customer
    const customer = await CustomerModel.create(
      [
        {
          customerName,
          customerPhone,
          customerAddress,
          visitorId,
          customerNote,
        },
      ],
      { session }
    );

    // Create order with customer reference
    const result = await OrderModel.create(
      [
        {
          ...orderData,
          customer: customer[0]._id,
          shopId,
          userId,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return {
      message: "Order created successfully.",
      status: 200,
      data: JSON.parse(JSON.stringify(result[0])),
    };
  } catch (error) {
    await session.abortTransaction();
    throw new Error(`Failed to create order: ${error.message}`);
  } finally {
    session.endSession();
  }
}

const getOrderDetailsQuary = async (id) => {
  await dbConnect();

  const orderDetails = await OrderModel.findById(id)
    .populate({
      path: "customer",
      select: "customerAddress customerPhone customerName",
      as: "category",
    })
    .lean();
  if (!orderDetails) return null;

  // Extract product IDs from order
  const productIds = [...orderDetails.productId] || [];
  // Fetch only ordered products
  const orderedProducts = await ProductModel.find({
    _id: { $in: productIds },
  })
    .select(
      "productName variants mainImage regularPrice discountType discountValue"
    )
    .lean();
  orderDetails.products = orderedProducts;

  return replaceMongoIdInObject(JSON.parse(JSON.stringify(orderDetails)));
};

async function getAllOrderUserQuary({ shopId, userId }) {
  await dbConnect();

  // 1️⃣ Fetch all orders with customer info
  const orders = await OrderModel.find({ shopId, userId })
    .populate("customer", "customerAddress customerPhone customerName")
    .sort({ createdAt: -1 })
    .lean();

  if (orders.length === 0) return [];

  // 2️⃣ Collect all product IDs in ONE go
  const productIds = [
    ...new Set(orders.flatMap((o) => o.productId.map(String))),
  ];

  // 3️⃣ Fetch required product fields ONLY
  const products = await ProductModel.find({ _id: { $in: productIds } })
    .select(
      "productName variants mainImage regularPrice discountType discountValue"
    )
    .lean();

  // 4️⃣ Map products for O(1) lookup
  const productMap = Object.fromEntries(
    products.map((p) => [String(p._id), p])
  );

  // 5️⃣ Attach product details to each order (fast mapping)
  const orderlist = orders.map((order) => ({
    ...order,
    products: order.productId.map((id) => productMap[String(id)] || null),
  }));
  return replaceMongoIdInArray(JSON.parse(JSON.stringify(orderlist)));
}

async function updateOrderStatus({ orderId, status }) {
  await dbConnect();

  if (!orderId) throw new Error("Order ID is required");
  if (!status) throw new Error("Status is required");

  // Update order status
  const updatedOrder = await OrderModel.findByIdAndUpdate(
    orderId,
    { status },
    { new: true }
  )
    .populate("customer", "customerName customerPhone customerAddress")
    .lean();

  if (!updatedOrder) throw new Error("Order not found");

  return {
    message: "Order status updated successfully",
    status: 200,
    data: replaceMongoIdInObject(JSON.parse(JSON.stringify(updatedOrder))),
  };
}
async function updateMultipleOrderStatus({ orderId, status }) {
  await dbConnect();

  if (!orderId || !Array.isArray(orderId) || orderId.length === 0)
    throw new Error("Order IDs array is required");

  if (!status) throw new Error("Status is required");

  // Update multiple orders at once
  await OrderModel.updateMany({ _id: { $in: orderId } }, { $set: { status } });

  // Fetch updated orders (optional)
  const updatedOrders = await OrderModel.find({ _id: { $in: orderId } })
    .populate("customer", "customerName customerPhone customerAddress")
    .lean();

  return {
    message: "Order status updated successfully",
    status: 200,
    data: replaceMongoIdInArray(JSON.parse(JSON.stringify(updatedOrders))),
  };
}

async function getRecentOrderUserQuery({ shopId, userId }) {
  await dbConnect();

  // 1️⃣ Fetch all orders with customer info
  const orders = await OrderModel.find({ shopId, userId })
    .populate("customer", "customerAddress customerPhone customerName")
    .sort({ createdAt: -1 })
    .select("_id customer status createdAt grand_total")
    .limit(4)
    .lean();

  if (orders.length === 0) return [];

  return replaceMongoIdInArray(JSON.parse(JSON.stringify(orders)));
}

async function getTopSellingProducts({ shopId, userId }) {
  await dbConnect();

  const topProducts = await OrderModel.aggregate([
    {
      $match: { shopId, userId }
    },
    {
      $unwind: "$productId"
    },
    {
      $group: {
        _id: "$productId",
        saleCount: { $sum: 1 }
      }
    },
    {
      $sort: { saleCount: -1 }
    },
    {
      $limit: 5
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productData"
      }
    },
    {
      $unwind: "$productData"
    },
    {
      $project: {
        _id: 1,
        saleCount: 1,
        productName: "$productData.productName",
        mainImage: "$productData.mainImage",
        regularPrice: "$productData.regularPrice",
        discountType: "$productData.discountType",
        discountValue: "$productData.discountValue"
      }
    }
  ]);

  return JSON.parse(JSON.stringify(topProducts));
}

async function getOrderDashboardStats({ shopId, userId }) {
  await dbConnect();

  const [stats] = await OrderModel.aggregate([
    {
      $match: { shopId, userId }
    },
    {
      $facet: {
        total: [{ $count: "count" }],
        confirmed: [
          { $match: { status: "confirmed" } },
          { $count: "count" }
        ],
        pending: [
          { $match: { status: "pending" } },
          { $count: "count" }
        ],
        shipped: [
          { $match: { status: "shipped" } },
          { $count: "count" }
        ],
        cancelled: [
          { $match: { status: "cancelled" } },
          { $count: "count" }
        ]
      }
    }
  ]);

  const total = stats.total[0]?.count ?? 0;

  return {
    totalOrders: total,
    confirmed: stats.confirmed[0]?.count ?? 0,
    pending: stats.pending[0]?.count ?? 0,
    shipped: stats.shipped[0]?.count ?? 0,
    cancelled: stats.cancelled[0]?.count ?? 0,
  };
}



export {
  orderQuery,
  getRecentOrderUserQuery,
  getOrderDetailsQuary,
  getAllOrderUserQuary,
  getOrderDashboardStats,
  getTopSellingProducts,
  updateMultipleOrderStatus,
  updateOrderStatus,
};

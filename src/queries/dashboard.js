import { CardModel } from "@/model/cards-model";
import { DepositeModel } from "@/model/deposite-model";
import { CardOrderModel } from "@/model/order-model";
import { userModel } from "@/model/user-model";

const { dbConnect } = require("@/service/mongo");

async function getDashboardReportsFromDB(id) {
  await dbConnect();

  // Fetch data
  const depositeList = await DepositeModel.find({})
    .sort({ createdAt: -1 })
    .lean();
  const cardList = await CardModel.find({}).sort({ createdAt: -1 }).lean();
  const orderList = await CardOrderModel.find({})
    .sort({ createdAt: -1 })
    .lean();
  const userList = await userModel.find({}).sort({ createdAt: -1 }).lean();

  // Extra Stats
  const totalUsers = userList.length;
  const totalUserBalance = userList.reduce(
    (sum, user) => sum + (user.balance || 0),
    0
  );

  const totalOrders = orderList.length;
  const confirmedOrders = orderList.filter(
    (order) => order.status === "Confirmed"
  ).length;
  const deliveredOrders = orderList.filter(
    (order) => order.status === "Delivered"
  ).length;

  const completedDeposits = depositeList.filter(
    (deposit) => deposit.status === "completed"
  );
  const totalCompletedDepositAmount = completedDeposits.reduce(
    (sum, dep) => sum + parseFloat(dep.amount_usd || "0"),
    0
  );

  return JSON.parse(
    JSON.stringify({
      totalUsers,
      totalUserBalance,
      totalOrders,
      confirmedOrders,
      deliveredOrders,
      totalCompletedDepositAmount,
    })
  );
}

export const dashboardQueries = { getDashboardReportsFromDB };

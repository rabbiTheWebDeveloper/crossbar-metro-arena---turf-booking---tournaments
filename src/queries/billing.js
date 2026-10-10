import { BillingModel } from "@/model/billing-model";
import { UserModel } from "@/model/user-model";
import { dbConnect } from "@/service/mongo";
import mongoose from "mongoose";
import {
  PLANS,
  BILLING_CYCLE_DAYS,
  GRACE_PERIOD_DAYS,
  VAT_PERCENT,
} from "@/config/billingConfig";

// Re-export for server actions that need it
export { PLANS };

function genInvoiceNumber(userId) {
  const now = new Date();
  const ym   = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rand  = String(userId).slice(-4).toUpperCase();
  const seq   = Math.floor(1000 + Math.random() * 9000);
  return `INV-${ym}-${rand}${seq}`;
}

// ── Create one bill for a shop ─────────────────────────────────────────────────
export async function createBillingForShop({ userId, shopId, planName = "Basic" }) {
  await dbConnect();
  const plan = PLANS[planName] || PLANS.Basic;

  const now         = new Date();
  const periodEnd   = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + BILLING_CYCLE_DAYS);
  const dueDate     = new Date(periodEnd);
  dueDate.setDate(dueDate.getDate() + GRACE_PERIOD_DAYS);

  const tax      = Math.round(plan.price * (VAT_PERCENT / 100));
  const totalDue = plan.price + tax;

  const billing = await BillingModel.create({
    userId,
    shopId,
    invoiceNumber:      genInvoiceNumber(userId),
    invoiceTitle:       `${planName} Plan - Monthly Platform Fee`,
    billingPeriodStart: now,
    billingPeriodEnd:   periodEnd,
    dueDate,
    amount:    plan.price,
    tax,
    totalDue,
    planName,
    planPrice: plan.price,
    status:    "unpaid",
  });

  return JSON.parse(JSON.stringify(billing));
}

// ── Auto-generate bills for ALL shops that are due ─────────────────────────────
export async function generateMonthlyBillings() {
  await dbConnect();
  const now = new Date();

  const users = await UserModel.find({
    $or: [
      { next_payment_date: null },
      { next_payment_date: { $lte: now } },
    ],
  }).populate("shops").lean();

  const created = [];
  const errors  = [];

  for (const user of users) {
    for (const shop of user.shops || []) {
      try {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const existing   = await BillingModel.findOne({
          userId:             user._id,
          shopId:             shop._id,
          billingPeriodStart: { $gte: monthStart },
        });
        if (existing) continue;

        const bill = await createBillingForShop({
          userId:   user._id,
          shopId:   shop._id,
          planName: "Basic",
        });
        created.push(bill);

        const nextDate = new Date(now);
        nextDate.setDate(nextDate.getDate() + BILLING_CYCLE_DAYS);
        await UserModel.findByIdAndUpdate(user._id, {
          next_payment_date: nextDate,
          payment_status:    "unpaid",
        });
      } catch (err) {
        errors.push({ userId: String(user._id), error: err.message });
      }
    }
  }

  return { created: created.length, errors };
}

// ── Get all billings for a shop ────────────────────────────────────────────────
export async function getBillingsForShop({ userId, shopId }) {
  await dbConnect();
  if (!userId || !shopId) return [];
  const bills = await BillingModel.find({ userId, shopId })
    .sort({ createdAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(bills));
}

// ── Mark a bill paid ───────────────────────────────────────────────────────────
export async function markBillingPaid({ billingId, paymentMethod, transactionId }) {
  await dbConnect();
  const updated = await BillingModel.findByIdAndUpdate(
    billingId,
    {
      status:        "paid",
      paidAt:        new Date(),
      paymentMethod: paymentMethod || "manual",
      transactionId: transactionId || "",
    },
    { new: true }
  ).lean();

  if (!updated) throw new Error("Billing not found");

  await UserModel.findByIdAndUpdate(updated.userId, { payment_status: "paid" });
  return JSON.parse(JSON.stringify(updated));
}

// ── Mark overdue bills ─────────────────────────────────────────────────────────
export async function markOverdueBillings() {
  await dbConnect();
  const result = await BillingModel.updateMany(
    { status: "unpaid", dueDate: { $lt: new Date() } },
    { $set: { status: "overdue" } }
  );
  return result.modifiedCount;
}

// ── Summary stats ──────────────────────────────────────────────────────────────
export async function getBillingSummary({ userId, shopId }) {
  await dbConnect();
  if (!userId || !shopId) return { total: 0, paid: 0, unpaid: 0, overdue: 0, totalPaid: 0 };

  const uid = new mongoose.Types.ObjectId(userId);
  const sid = new mongoose.Types.ObjectId(shopId);

  const [counts, paidAgg] = await Promise.all([
    BillingModel.aggregate([
      { $match: { userId: uid, shopId: sid } },
      { $group: {
        _id:     null,
        total:   { $sum: 1 },
        paid:    { $sum: { $cond: [{ $eq: ["$status","paid"]    }, 1, 0] } },
        unpaid:  { $sum: { $cond: [{ $eq: ["$status","unpaid"]  }, 1, 0] } },
        overdue: { $sum: { $cond: [{ $eq: ["$status","overdue"] }, 1, 0] } },
      }},
    ]),
    BillingModel.aggregate([
      { $match: { userId: uid, shopId: sid, status: "paid" } },
      { $group: { _id: null, total: { $sum: "$totalDue" } } },
    ]),
  ]);

  const c = counts[0] || {};
  return {
    total:     c.total    || 0,
    paid:      c.paid     || 0,
    unpaid:    c.unpaid   || 0,
    overdue:   c.overdue  || 0,
    totalPaid: paidAgg[0]?.total || 0,
  };
}

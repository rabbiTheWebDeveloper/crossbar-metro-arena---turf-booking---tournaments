"use server";
import {
  createBillingForShop,
  generateMonthlyBillings,
  markBillingPaid,
  getBillingsForShop,
  getBillingSummary,
} from "@/queries/billing";
import { revalidatePath } from "next/cache";

export async function generateMonthlyBillingsAction() {
  try {
    const result = await generateMonthlyBillings();
    revalidatePath("/dashboard/billings");
    return { success: true, ...result };
  } catch (error) {
    throw new Error(error.message || "Failed to generate billings");
  }
}

export async function createManualBillingAction({ userId, shopId, planName }) {
  try {
    const bill = await createBillingForShop({ userId, shopId, planName });
    revalidatePath("/dashboard/billings");
    return { success: true, data: bill };
  } catch (error) {
    throw new Error(error.message || "Failed to create billing");
  }
}

export async function markBillingPaidAction({ billingId, paymentMethod, transactionId }) {
  try {
    const result = await markBillingPaid({ billingId, paymentMethod, transactionId });
    revalidatePath("/dashboard/billings");
    return { success: true, data: result };
  } catch (error) {
    throw new Error(error.message || "Failed to mark as paid");
  }
}

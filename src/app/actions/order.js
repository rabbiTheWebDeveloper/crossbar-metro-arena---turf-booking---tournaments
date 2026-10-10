"use server";
import { orderQuery, updateMultipleOrderStatus, updateOrderStatus } from "@/queries/order";
import { revalidatePath } from "next/cache";

export async function createOrderAction(data) {
  try {
    const response = await orderQuery(data);
    revalidatePath("/dashboard/orders");
    return response;
  } catch (error) {
    throw new Error(error.message || "Failed to create order");
  }
}

export async function updateMultipleOrderStatusAction(data) {
  try {
    const response = await updateMultipleOrderStatus(data);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

export async function updateOrderStatusAction(data) {
  try {
    const response = await updateOrderStatus(data);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

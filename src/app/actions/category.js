"use server";
import { createCategoryQuary } from "@/queries/categories";
import { revalidatePath } from "next/cache";

export async function createCategoryAction(data, userId, shopId) {
  try {
    const response = await createCategoryQuary(data, userId, shopId);
    revalidatePath(`/dashboard/category`);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

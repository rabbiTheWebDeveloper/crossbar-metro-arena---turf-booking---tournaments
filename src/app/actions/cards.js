"use server";
import { createCardDBQuery, deleteCard, updateCard } from "@/queries/card";
import { revalidatePath } from "next/cache";

export async function createCardAction(data) {
  try {
    const response = await createCardDBQuery(data);
    revalidatePath(`/admin/cards`);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

export async function updateCardAction(id,data) {
  try {
    
    const response = await updateCard(id,data);
    revalidatePath(`/admin/cards`);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

export async function deleteCardAction(data) {
  try {
    const response = await deleteCard(data);
    revalidatePath(`/admin/cards`);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

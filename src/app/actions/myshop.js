"use server";
import { updateDeliveryQuery } from "@/queries/delivery";
import { domainQuery } from "@/queries/domain";
import { seoMarketingQuery } from "@/queries/seoMarketing";
import { updateSocialLinkQuery } from "@/queries/socialLink";
import { themeQuery } from "@/queries/theme";
import { upsertCourierSettings } from "@/queries/courier";
import { revalidatePath } from "next/cache";

export async function myshopThemeColorUpdateQuaryAction(data) {
  try {
    const response = await themeQuery(data);
    // revalidatePath(`/registration`);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

export async function myshopUpdateDeliveryQueryAction(data) {
  try {
    const response = await updateDeliveryQuery(data);
    // revalidatePath(`/registration`);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

export async function myshopUpdateSocialLinkQueryAction(data) {
  try {
    const response = await updateSocialLinkQuery(data);
    // revalidatePath(`/registration`);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

export async function myshopUpdateDomainQueryAction(data) {
  try {
    const response = await domainQuery(data);
    // revalidatePath(`/registration`);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

export async function myshopUpdateSeoMarketingQueryAction(data) {
  try {
    const response = await seoMarketingQuery(data);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

export async function saveCourierSettingsAction({ userId, shopId, courierType, data }) {
  try {
    const response = await upsertCourierSettings({ userId, shopId, courierType, data });
    revalidatePath("/dashboard/myshop/manage/courier");
    return { success: true, data: response };
  } catch (error) {
    throw new Error(error.message || "Failed to save courier settings");
  }
}
"use server";

import { signIn } from "@/auth";
import {
  getAffiliateReport,
  getAffiliationBySpecificStatusAndDate,
  getOnBoardingBySpecificStatusAndDate,
  saveOnBoardingQuery,
  updateOnBoarding,
  updateOnBoardingDetailsQuery,
  updateOnBoardingQuery,
} from "@/queries/onBoarding";
import { createProductDB, deleteProduct } from "@/queries/product";
import { updateSetting } from "@/queries/setting";
import { passwordChange, updatePersonalInfo } from "@/queries/user";
import { revalidatePath } from "next/cache";

export async function login(formData) {
  try {
    const response = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    return JSON.parse(JSON.stringify(response));
  } catch (error) {
    throw new Error(error);
  }
}

export async function userUpdatePassword(formData) {
  try {
    const response = await passwordChange(formData);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

export async function userUpdateSetting(formData) {
  try {
    const response = await updatePersonalInfo(formData);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}



export async function updateNote(formData) {
  try {
    const response = await updateOnBoarding(formData);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

export async function deleteproductByID() {
  // revalidatePath(`/details/${favoriteId}`);
  revalidatePath(`/dashboard/product`);
}

export default async function actionBanner() {
  revalidatePath(`/dashboard/banner`);
}

export async function updateOnBoardingDetailsAction(id, updateData) {
  try {
    const response = await updateOnBoardingDetailsQuery(id, updateData);
    revalidatePath(`/dashboard/on-boarding-report`);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getOnBoardingBySpecificStatusAndDateAction(
  status,
  searchParam,
  creationDate
) {
  try {
    const response = await getOnBoardingBySpecificStatusAndDate(
      status,
      searchParam,
      creationDate
    );
    revalidatePath(`/dashboard/on-boarding-report`);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

export async function getAffiliationBySpecificStatusAndDateAction(
  status,
  searchParam,
  creationDate
) {
  try {
    const response = await getAffiliationBySpecificStatusAndDate(
      status,
      searchParam,
      creationDate
    );
    revalidatePath(`/dashboard/on-boarding-report`);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

export async function saveOnBoardingAction(data) {
  try {
    const response = await saveOnBoardingQuery(data);
    revalidatePath(`/dashboard/on-boarding-report`);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

export async function updateOnBoardingAction(id, data) {
  try {
    const response = await updateOnBoardingQuery(id, data);
    revalidatePath(`/dashboard/on-boarding-report`);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

export async function affiliationReportDashboardAction(id, data) {

  try {
    const response = await getAffiliateReport(id, data);
    revalidatePath(`/affiliation-user`);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

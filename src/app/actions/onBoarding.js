"use server";

import { updateOnBoarding, updateOnBoardingDetailsQuery } from "@/queries/onBoarding";

async function updateNote(formData) {
  try {
    const response = await updateOnBoarding(formData);
    return response;
  } catch (error) {
    throw new Error(error);
  }
}


// async function updateOnBoardingDetailsAction(id , searchParam , creationDate) {
//   try {
//     const response = await updateOnBoardingDetailsQuery(id, updateData);
//     return response;
//   } catch (error) {
//     throw new Error(error);
//   }
// }
// export const onBoardingAction = {
//   updateNote,
//   updateOnBoardingDetailsAction
// };

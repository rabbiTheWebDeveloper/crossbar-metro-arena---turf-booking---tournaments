import { replaceMongoIdInArray } from "@/lib/convertData";
import { shopLandingPageModel } from "@/model/shopLandingPage-model";
import { dbConnect } from "@/service/mongo";

// export async function getShopWiseVisitorCounts() {
//   await dbConnect();
//   const currentDate = new Date().toISOString().split("T")[0];
//   try {
//     const visitorCounts = await shopVisitorModel.find({
//       date: currentDate
//     }).sort({ date: 1 }).lean();
//     return visitorCounts;
//   } catch (error) {
//     console.error('Error retrieving visitor counts:', error);
//     throw new Error('Failed to retrieve visitor counts');
//   }
// }

export async function getShopWiseLandingVisitorCounts() {
  await dbConnect();
  const date = new Date();
  const bangladeshOffset = 6 * 60; // Bangladesh is UTC+6
  const localOffset = date.getTimezoneOffset(); // Local time offset in minutes
  const totalOffset = bangladeshOffset + localOffset;
  
  // Convert to Bangladesh time by adding the offset
  const bangladeshTime = new Date(date.getTime() + totalOffset * 60 * 1000);
  
  // Extract the current date and hour in Bangladesh time
  const currentDate = bangladeshTime.toISOString().split("T")[0];
  const visitorCounts = await shopLandingPageModel.find({ }, { shopId: 1,landingPageSlug: 1, date: 1, totalCount: 1,  }).lean();
  return replaceMongoIdInArray(JSON.parse(JSON.stringify(visitorCounts)));
}
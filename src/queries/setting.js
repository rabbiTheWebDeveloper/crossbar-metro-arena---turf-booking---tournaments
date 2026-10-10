import { replaceMongoIdInObject } from "@/lib/convertData";
import { SettingsModel } from "@/model/shopInfo-model";
import { dbConnect } from "@/service/mongo";
import cloudinary from "@/utlis/cloudinary";
import upload from "@/utlis/imageUpload";

export async function getSetting() {
  await dbConnect();
  const categories = await SettingsModel.findById(
    "666ebddff209767f563e46a6"
  ).lean();
  return replaceMongoIdInObject(categories);
}






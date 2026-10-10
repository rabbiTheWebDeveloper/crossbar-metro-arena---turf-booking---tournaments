import { CourierModel } from "@/model/courier-model";
import { dbConnect } from "@/service/mongo";

export async function getCourierSettings({ userId, shopId }) {
  await dbConnect();
  const settings = await CourierModel.findOne({ userId, shopId }).lean();
  if (!settings) return null;
  return JSON.parse(JSON.stringify(settings));
}

export async function upsertCourierSettings({ userId, shopId, courierType, data }) {
  await dbConnect();
  const update = {};
  Object.entries(data).forEach(([key, value]) => {
    update[`${courierType}.${key}`] = value;
  });

  const result = await CourierModel.findOneAndUpdate(
    { userId, shopId },
    { $set: update },
    { upsert: true, new: true, lean: true }
  );
  return JSON.parse(JSON.stringify(result));
}

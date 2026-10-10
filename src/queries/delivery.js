import { deliveryModel } from "@/model/delivery-model";
import { dbConnect } from "@/service/mongo";

async function updateDeliveryQuery(data) {
  await dbConnect();

  const { userId, shopId, ...otherFields } = data;

  if (!shopId) throw new Error("Shop ID is required");

  const result = await deliveryModel.findOneAndUpdate(
    { userId, shopId },
    {
      $set: {
        userId,
        shopId,
        ...otherFields, // ✅ spread all  fields properly
      },
    },
    { new: true, upsert: true }
  );

  return {
    message: "Delivery information saved successfully.",
    status: 200,
    data: JSON.parse(JSON.stringify(result)),
  };
}

async function getdeliveryQuery({ userId, shopId }) {
  await dbConnect();
  const theme = await deliveryModel.findOne({ userId, shopId }).lean();
  if (!theme) {
    return {
      message: "delivery not found.",
      status: 404,
      data: null,
    };
  }
  return {
    message: "Theme retrieved successfully.",
    status: 200,
    data: JSON.parse(JSON.stringify(theme)),
  };
}

export { updateDeliveryQuery, getdeliveryQuery };

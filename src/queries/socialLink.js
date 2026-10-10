import { SocialLinkModel } from "@/model/socialLink-model";
import { dbConnect } from "@/service/mongo";

async function updateSocialLinkQuery(data) {
  await dbConnect();

  const { userId, shopId, ...otherFields } = data;

  if (!shopId) throw new Error("Shop ID is required");

  const result = await SocialLinkModel.findOneAndUpdate(
    { userId, shopId },
    {
      $set: {
        userId,
        shopId,
        ...otherFields,
        lastUpdatedBy: userId,
      },
      $push: {
        logs: { updatedBy: userId, updatedAt: new Date() },
      },
    },
    { new: true, upsert: true }
  );

  return {
    message: "Social link updated successfully.",
    status: 200,
    data: JSON.parse(JSON.stringify(result)),
  };
}

async function getSocialLinkQuery({ userId, shopId }) {
  await dbConnect();
  const theme = await SocialLinkModel.findOne({ userId, shopId }).lean();
  if (!theme) {
    return {
      message: "Social link not found.",
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

export { updateSocialLinkQuery, getSocialLinkQuery };

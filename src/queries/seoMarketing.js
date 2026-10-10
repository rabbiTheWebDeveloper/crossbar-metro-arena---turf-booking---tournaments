import { SeoMarketingModel } from "@/model/seoMarketing-model";
import { dbConnect } from "@/service/mongo";

export async function seoMarketingQuery(data) {
  await dbConnect();

  const { userId, shopId, ...otherFields } = data;
  if (!shopId) throw new Error("Shop ID is required");

  const result = await SeoMarketingModel.findOneAndUpdate(
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
    message: "SEO & Marketing settings uccessfully.",
    status: 200,
    data: JSON.parse(JSON.stringify(result)),
  };
}

async function getSeoMarketingQuery({ userId, shopId }) {
  await dbConnect();
  const domain = await SeoMarketingModel.findOne({ userId, shopId }).lean();
  if (!domain) {
    return {
      message: "SEO & Marketing settings not found.",
      status: 404,
      data: null,
    };
  }
  return {
    message: "SEO & Marketing settings retrieved successfully.",
    status: 200,
    data: JSON.parse(JSON.stringify(domain)),
  };
}
export { seoMarketingQuery, getSeoMarketingQuery };

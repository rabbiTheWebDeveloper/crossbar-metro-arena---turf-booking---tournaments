import { dbConnect } from "@/service/mongo";

const { DomainModel } = require("@/model/domain-model");

export async function domainQuery(data) {
  await dbConnect();

  const { userId, shopId, ...otherFields } = data;
  if (!shopId) throw new Error("Shop ID is required");

  const result = await DomainModel.findOneAndUpdate(
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
    message: "Domain saved successfully.",
    status: 200,
    data:JSON.parse(JSON.stringify(result)),
  };
}

async function getDomainQuery({ userId, shopId }) {
  await dbConnect();
  const domain = await DomainModel.findOne({ userId, shopId },{domain_name: 1 ,domain_status: 1 ,_id: 0}).lean();
  if (!domain) {
    return {
      message: "Domain not found.",
      status: 404,
      data: null,
    };
  }
  return {
    message: "Domain retrieved successfully.",
    status: 200,
    data: JSON.parse(JSON.stringify(domain)),
  };
}
export { domainQuery, getDomainQuery };

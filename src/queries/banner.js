import { BannerModel } from "@/model/banner-model";
import { dbConnect } from "@/service/mongo";

async function getBannerQuery({ userId, shopId }) {
  await dbConnect();
  const banner = await BannerModel.findOne(
    { userId, shopId },
    { images: 1, _id: 0 }
  ).lean();
  if (!banner) {
    return {
      message: "Banner not found.",
      status: 404,
      data: null,
    };
  }

  return JSON.parse(JSON.stringify(banner));
}
export { getBannerQuery };

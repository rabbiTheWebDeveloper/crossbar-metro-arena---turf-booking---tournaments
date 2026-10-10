import { SliderModel } from "@/model/slider";
import { dbConnect } from "@/service/mongo";

async function getSliderQuery({ userId, shopId }) {
  await dbConnect();
  const slider = await SliderModel.findOne(
    { userId, shopId },
    { images: 1, _id: 0 }
  ).lean();
  if (!slider) {
    return {
      message: "Slider not found.",
      status: 404,
      data: null,
    };
  }
  return {
    message: "Slider retrieved successfully.",
    status: 200,
    data: JSON.parse(JSON.stringify(slider)),
  };
}
export { getSliderQuery };

import { ThemeModel } from "@/model/theme-model";
import { dbConnect } from "@/service/mongo";

async function themeQuery(data) {
  await dbConnect();

  const { userId, shopId, ...themeFields } = data;

  if (!shopId) throw new Error("Shop ID is required");

  const result = await ThemeModel.findOneAndUpdate(
    { userId, shopId },
    {
      $set: {
        userId,
        shopId,
        ...themeFields, // ✅ spread all color fields properly
        lastUpdatedBy: userId,
        updatedAt: new Date(),
      },
    },
    { new: true, upsert: true }
  );

  return {
    message: "Theme saved successfully.",
    status: 200,
    data: JSON.parse(JSON.stringify(result)),
  };
}

async function getThemeQuery({ userId, shopId }) {
  await dbConnect();
  const theme = await ThemeModel.findOne({ userId, shopId }).lean();
  if (!theme) {
    return {
      message: "Theme not found.",
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

export { themeQuery, getThemeQuery };

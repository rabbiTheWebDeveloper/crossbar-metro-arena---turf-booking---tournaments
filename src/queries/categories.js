import { dbConnect } from "@/service/mongo";
import Category from "@/model/category-model";

async function getAllCategoriesQuary({ shopId, userId }) {
  await dbConnect();
  try {
    const categories = await Category.find({ shopId, userId }).sort({
      createdAt: -1,
    });
    return JSON.parse(JSON.stringify(categories));
  } catch (error) {
    throw new Error(error.message || "Failed to fetch categories");
  }
}

async function getAllCategoriesUserQuary({ shopId, userId }) {
  await dbConnect();
  try {
    const categories = await Category.find({ shopId, userId })
      .sort({ createdAt: -1 })
      .select("name _id")
      .lean();
    return JSON.parse(JSON.stringify(categories));
  } catch (error) {
    throw new Error(error.message || "Failed to fetch categories");
  }
}
async function getShopCategoryByIDQuery(id) {
  await dbConnect();
  const category = await Category.findById(id, {
    image: 1,
    name: 1,
    status: 1
  }).lean();
  if (!category) {
    return {
      message: "Category not found.",
      status: 404,
      data: null,
    };
  }

  return JSON.parse(JSON.stringify(category));
}

export {
  getAllCategoriesQuary,
  getAllCategoriesUserQuary,
  getShopCategoryByIDQuery,
};

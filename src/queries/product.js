import { dbConnect } from "@/service/mongo";
import { ProductModel } from "@/model/product-model";

async function getAllProductQuary({ shopId, userId }) {
  await dbConnect();
  try {
    const categories = await ProductModel.find({ shopId, userId })
      .populate({ path: "categoryId", select: "name", as: "category" })
      .sort({
        createdAt: -1,
      });
    return JSON.parse(JSON.stringify(categories));
  } catch (error) {
    throw new Error(error.message || "Failed to fetch categories");
  }
}

async function getAllProductUserQuary({ shopId, userId }) {
  await dbConnect();
  try {
    const categories = await ProductModel.find({ shopId, userId })
      .sort({ createdAt: -1 })
      .select("name _id")
      .lean();
    return JSON.parse(JSON.stringify(categories));
  } catch (error) {
    throw new Error(error.message || "Failed to fetch categories");
  }
}
async function getAllProductOrderUserQuary({ shopId, userId }) {
  await dbConnect();
  try {
    const categories = await ProductModel.find({ shopId, userId })
      .sort({ createdAt: -1 })
      .select("productName _id variants mainImage regularPrice discountType discountValue")
      .lean();
    return JSON.parse(JSON.stringify(categories));
  } catch (error) {
    throw new Error(error.message || "Failed to fetch categories");
  }
}
async function getShopProductByIDQuery(id) {
  await dbConnect();
  const products = await ProductModel.findById(id).lean();
  if (!products) {
    return {
      message: "Product not found.",
      status: 404,
      data: null,
    };
  }

  return JSON.parse(JSON.stringify(products));
}
export {
  getAllProductQuary,
  getAllProductUserQuary,
  getShopProductByIDQuery,
  getAllProductOrderUserQuary,
};

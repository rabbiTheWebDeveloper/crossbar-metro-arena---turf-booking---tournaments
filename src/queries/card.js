import { CardModel } from "@/model/cards-model";
import { dbConnect } from "@/service/mongo";

export async function createCardDBQuery(data) {
  await dbConnect();
  const newSetting = await CardModel.create(data);
  return JSON.parse(JSON.stringify(newSetting));
  // return replaceMongoIdInArray(categories);
}

export async function getCards() {
  await dbConnect();
  const categories = await CardModel.find({}).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(categories)); 
}

export async function getCard(id) {
  await dbConnect();
  const categories = await CardModel.findById(id).lean();
  return JSON.parse(JSON.stringify(categories));
}

export async function deleteCard(id) {
  await dbConnect();
  const categories = await CardModel.findByIdAndDelete(id).lean();
  return JSON.parse(JSON.stringify(categories));
}

export async function updateCard(id, data) {
  await dbConnect();
  const categories = await CardModel.findByIdAndUpdate(id, data, {
    new: true,
  }).lean();
  return JSON.parse(JSON.stringify(categories))
}

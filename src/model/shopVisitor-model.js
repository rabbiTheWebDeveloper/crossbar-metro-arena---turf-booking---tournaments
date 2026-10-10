import mongoose, {
  Schema,
} from "mongoose";


const visitorSchema = new Schema({
  shopId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
    default: new Date().toISOString().split("T")[0],
  },
  hourlyCounts: {
    type: [{
      hour: Number,
      count: Number
    }],
    default: Array.from({
      length: 24
    }, (_, i) => ({
      hour: i,
      count: 0
    })),
  },
  totalCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  versionKey: false,
});
export const shopVisitorModel = mongoose.models.tests ?? mongoose.model("tests", visitorSchema);
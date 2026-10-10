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
  landingPageId: {
    type: String,
    required: true,
  },
  landingPageSlug: {
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
export const shopLandingPageModel = mongoose.models.landingPageVisitor ?? mongoose.model("landingPageVisitor", visitorSchema);
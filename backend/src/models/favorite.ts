import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const favoriteSchema = new Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      default: '',
    },
    time: {
      type: String,
      default: '',
    },
    venue: {
      type: String,
      default: '',
    },
    genre: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    url: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

export type Favorite = InferSchemaType<typeof favoriteSchema>;
export type FavoriteDocument = HydratedDocument<Favorite>;

export const FavoriteModel = model('Favorite', favoriteSchema);



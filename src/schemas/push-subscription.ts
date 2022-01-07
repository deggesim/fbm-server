import { Model, model, Schema } from "mongoose";
import { ITenant } from "./league";

interface IPushSubscriptionDocument extends ITenant {
  email: string;
  endpoint: string;
  expirationTime: number;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Estensione del Document per l'aggiunta di metodi d'istanza
 */
// tslint:disable-next-line: no-empty-interface
export interface IPushSubscription extends IPushSubscriptionDocument {
  // metodi d'istanza
}

/**
 * Estensione del Model per l'aggiunta di metodi statici
 */
export interface IPushSubscriptionModel
  extends Model<IPushSubscriptionDocument> {
  // metodi statici
}

const schema = new Schema<IPushSubscription>(
  {
    email: {
      type: String,
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    expirationTime: {
      type: Number,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
      },
      auth: {
        type: String,
        required: true,
      },
    },
    league: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "League",
    },
  },
  {
    timestamps: true,
  }
);

export const PushSubscription = model<
  IPushSubscription,
  IPushSubscriptionModel
>("PushSubscription", schema);

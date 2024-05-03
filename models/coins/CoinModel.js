import mongoose from "mongoose";

const CoinSchema = new mongoose.Schema({
  guid: {
    type: String,
    required: true,
    unique: true
  },
  type_: {
    type: String,
    required: true,
  },
  symbol: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  market_cap: {
    type: Number,
    required: true
  },
  rank: {
    type: Number,
    required: true
  },
  btc_price: {
    type: Number,
    required: true
  },
  prices: [{
    date: { type: String, required: true },
    price: { type: Number, required: true }
  }]
});

const Coin = mongoose.model("Coin", CoinSchema, "coins");

export default Coin

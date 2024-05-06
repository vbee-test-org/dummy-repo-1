import Coin from "../models/coins/CoinModel.js";

/***********************************Get coins****************************************/
const getCoins = async (req, res) => {
  try {
    const coins = await Coin.find({}, { _id: 0, guid: 1, type_: 1, symbol: 1, name: 1, market_cap: 1, rank: 1, btc_price: 1, prices: 1, thumbnail_image: 1 }).sort({ rank: 1 });
    const count = coins.length
    res.status(200).json({ count, coins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/***********************************Get a specific coin****************************************/
const getCoinsById = async (req, res) => {
  const symbol = (req.params.symbol).toUpperCase();
  if (!symbol) {
    return res.status(400).json({ error: "Coin symbol must not be null/undefined" })
  }
  try {
    const coins = await Coin.find({ symbol: symbol }, { _id: 0, guid: 1, type_: 1, symbol: 1, name: 1, market_cap: 1, rank: 1, btc_price: 1, prices: 1, thumbnail_image: 1 }).sort({ rank: 1 });
    res.status(200).json({ coins })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export { getCoins, getCoinsById }

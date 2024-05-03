import Coin from "../models/coins/CoinModel.js";

/***********************************Get coins****************************************/
const getCoins = async (req, res) => {
  try {
    const coins = await Coin.find();
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
    const coins = await Coin.find({ symbol: symbol });
    res.status(200).json({ coins })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export { getCoins, getCoinsById }

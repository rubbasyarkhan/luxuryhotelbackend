import { SettingsModel } from "../Models/Settings.model.js";

export const getSettings = async (req, res) => {
  try {
    let s = await SettingsModel.findOne();
    if (!s) s = await SettingsModel.create({});
    res.json({ settings: s });
  } catch (e) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { hotelName, currency, taxPercent, permissions } = req.body;
    let s = await SettingsModel.findOne();
    if (!s) s = await SettingsModel.create({});
    if (hotelName !== undefined) s.hotelName = hotelName;
    if (currency !== undefined) s.currency = currency;
    if (taxPercent !== undefined) s.taxPercent = taxPercent;
    if (permissions !== undefined) s.permissions = permissions;
    await s.save();
    res.json({ settings: s });
  } catch (e) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

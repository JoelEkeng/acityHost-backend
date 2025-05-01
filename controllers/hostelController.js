const Hostel = require('../models/Hostel');

exports.createHostel = async (req, res) => {
  try {
    const hostel = new Hostel(req.body);
    const saved = await hostel.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating hostel:', err);
    res.status(500).json({ message: 'Server error creating hostel' });
  }
};

exports.getAllHostels = async (req, res) => {
  try {
    const hostels = await Hostel.find();
    res.json(hostels);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching hostels' });
  }
};

exports.getHostelById = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });
    res.json(hostel);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching hostel' });
  }
};

const User = require('../models/User');
const MaintenanceTicket = require('../models/MaintenanceTicket');

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate({
        path: 'maintenanceLogs',
        select: 'title category priority status roomNumber createdAt updatedAt',
      })
      .populate({
        path: 'currentBooking',
        populate: [
          {
            path: 'roomId',
            select: 'roomNumber floor wing roomType roomFacilities'
          }
        ] 
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};   


exports.updateProfile = async (req, res) => {
  try {
    const {
      gender,
      rollNumber,
      parentName,
      parentPhone,
      healthConditions,
      allergies,
      emergencyContact,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only allow setting gender and roll number ONCE
    if (!user.gender && gender) {
      user.gender = gender;
    } else if (user.gender && gender && gender !== user.gender) {
      return res.status(400).json({ message: 'Gender is already set and cannot be changed.' });
    }

    if (!user.rollNumber && rollNumber) {
      user.rollNumber = rollNumber;
    } else if (user.rollNumber && rollNumber && rollNumber !== user.rollNumber) {
      return res.status(400).json({ message: 'Roll number is already set and cannot be changed.' });
    }

    // Optional fields can always be updated
    if (parentName) user.parentName = parentName;
    if (parentPhone) user.parentPhone = parentPhone;
    if (healthConditions) user.healthConditions = healthConditions;
    if (allergies) user.allergies = allergies;
    if (emergencyContact) user.emergencyContact = emergencyContact;

    await user.save();

    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating profile:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

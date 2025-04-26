const User = require('../models/User');
const MaintenanceTicket = require('../models/MaintenanceTicket');

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate({
        path: 'maintenanceLogs',
        select: 'title category priority status roomNumber createdAt updatedAt',
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

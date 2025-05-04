const Room = require('../models/Room');
const User = require('../models/User');

exports.getRooms = async (req, res) => {
  try {
    // const rooms = await Room.find().populate('currentOccupant', 'fullName email');
    const rooms = await Room.find()
    /* .select('roomNumber floor wing roomType roomFacilities beds') */
    .select('roomNumber floor wing roomType roomFacilities beds status hostel roomId')
    // .populate('currentOccupant', 'fullName email');
    /* .populate({
      path: 'currentOccupant',
      select: 'fullName email rollNumber roomNumber floor wing roomType roomFacilities beds status hostel roomId'
    }) */
    .populate({
      path: 'hostel',
      select: 'name'
    });
  // res.json(rooms);
    res.status(200).json(rooms);
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ message: 'Server error while fetching rooms' });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const {
      roomNumber,
      wing,
      floor,
      roomType,
      roomFacilities,
      status = 'Available',
      hostel
    } = req.body;

    const roomId = `${floor}${roomNumber}-${wing}`;

    const existingRoom = await Room.findOne({ roomId });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room already exists with ID ' + roomId });
    }

    const newRoom = new Room({
      roomNumber,
      wing,
      floor,
      roomType,
      roomFacilities,
      status,
      hostel,
      roomId
    });

    const savedRoom = await newRoom.save();
    res.status(201).json(savedRoom);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Server error while creating room' });
  }
};

exports.createBulkRooms = async (req, res) => {
  try {
    const { rooms } = req.body;

    if (!Array.isArray(rooms) || rooms.length === 0) {
      return res.status(400).json({ message: 'No rooms provided or invalid format' });
    }

    const formattedRooms = rooms.map(room => {
      const { roomNumber, floor, wing, roomType, roomFacilities, status = 'Available', hostel } = room;

      if (!roomNumber || !floor || !wing || !roomType || !roomFacilities || !hostel) {
        throw new Error('Missing required fields in room entry');
      }

      return {
        roomNumber,
        floor,
        wing,
        roomType,
        roomFacilities,
        hostel,
        status,
        roomId: `${floor}${roomNumber}-${wing}`
      };
    });

    const createdRooms = await Room.insertMany(formattedRooms, { ordered: false });

    res.status(201).json({
      message: `${createdRooms.length} rooms created successfully`,
      rooms: createdRooms
    });
  } catch (error) {
    console.error('Bulk room creation error:', error);
    res.status(500).json({ message: error.message || 'Server error during bulk room creation' });
  }
};

exports.updateRoomDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomType, roomFacilities } = req.body;

    if (!roomType && !roomFacilities) {
      return res.status(400).json({ message: 'Provide at least roomType or roomFacilities to update' });
    }

    const updates = {};
    if (roomType) updates.roomType = roomType;
    if (roomFacilities) updates.roomFacilities = roomFacilities;

    const updatedRoom = await Room.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedRoom) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.status(200).json({ message: 'Room updated successfully', room: updatedRoom });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ message: 'Server error while updating room' });
  }
};

exports.getRoomAvailability = async (req, res) => {
  try {
    const rooms = await Room.find()
      .select('roomNumber floor wing roomType roomFacilities beds');
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

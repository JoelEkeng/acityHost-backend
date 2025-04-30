const Room = require('../models/Room');
const User = require('../models/User');


exports.getRooms = async (req, res) => {
    try {
        const rooms = await Room.find().populate('currentOccupant', 'fullName email');
        res.json(rooms);
      } catch (err) {
        console.error('Error fetching rooms:', err);
        res.status(500).json({ message: 'Server error while fetching rooms' });
      }
}
exports.createRoom = async (req, res) => {
    try {
        const { roomId, roomNumber, wing, floor, roomType, roomFacilities, status, building } = req.body;

        // Check if the room already exists
        const existingRoom = await Room.findOne({ roomId });
        if (existingRoom) {
            return res.status(400).json({ message: 'Room already exists' });
        }

        // Create a new room
        const newRoom = new Room({
            roomId,
            roomNumber,
            wing,
            floor,
            roomType,
            roomFacilities,
            status,
            building
        });

        const savedRoom = await newRoom.save();
        res.status(201).json(savedRoom);
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

exports.createBulkRooms = async (req, res) => {
  try {
    const { rooms } = req.body;

    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
      return res.status(400).json({ message: 'No rooms provided or invalid format' });
    }

    // Generate roomId and validate fields
    const formattedRooms = rooms.map((room) => {
      const { roomNumber, floor, wing, roomType, roomFacilities, status, building } = room;

      if (!roomNumber || !floor || !wing || !roomType || !roomFacilities || !building) {
        throw new Error('Missing required fields in room entry');
      }

      return {
        roomNumber,
        floor,
        wing,
        roomType,
        roomFacilities,
        building,
        status: status || 'Available',
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

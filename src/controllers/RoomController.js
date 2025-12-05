import { RoomModel } from "../Models/Room.model.js";

export const createRoom = async (req, res) => {
  try {
    const roomData = req.body;
    
    const existingRoom = await RoomModel.findOne({ roomNumber: roomData.roomNumber });
    if (existingRoom) {
      return res.status(400).json({ message: "Room number already exists" });
    }

    const room = await RoomModel.create(roomData);
    res.status(201).json({ message: "Room created successfully", room });
  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all rooms with filtering and pagination
export const getAllRooms = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      roomType, 
      floor, 
      minPrice, 
      maxPrice,
      search 
    } = req.query;

    const filter = {};
    
    if (status) filter.status = status;
    if (roomType) filter.roomType = roomType;
    if (floor) filter.floor = parseInt(floor);
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = parseFloat(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = parseFloat(maxPrice);
    }
    if (search) {
      filter.$or = [
        { roomNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const rooms = await RoomModel.find(filter)
      .sort({ roomNumber: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await RoomModel.countDocuments(filter);

    res.json({
      rooms,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error("Get all rooms error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get room by ID
export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await RoomModel.findById(id);
    
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    res.json({ room });
  } catch (error) {
    console.error("Get room by ID error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update room
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if room number is being updated and if it already exists
    if (updateData.roomNumber) {
      const existingRoom = await RoomModel.findOne({ 
        roomNumber: updateData.roomNumber,
        _id: { $ne: id }
      });
      if (existingRoom) {
        return res.status(400).json({ message: "Room number already exists" });
      }
    }

    const room = await RoomModel.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    res.json({ message: "Room updated successfully", room });
  } catch (error) {
    console.error("Update room error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete room
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await RoomModel.findByIdAndDelete(id);
    
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Delete room error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Available', 'Occupied', 'Maintenance', 'Cleaning', 'Out of Order'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const room = await RoomModel.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );
    
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    res.json({ message: "Room status updated successfully", room });
  } catch (error) {
    console.error("Update room status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAvailableRooms = async (req, res) => {
  try {
    const { checkInDate, checkOutDate, roomType, guests } = req.query;

    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({ message: "Check-in and check-out dates are required" });
    }

    const filter = {
      status: 'Available',
      capacity: { $gte: parseInt(guests) || 1 }
    };

    if (roomType) filter.roomType = roomType;

    // TODO: Add logic to exclude rooms that are booked during the requested period
    // This would require checking the Booking model

    const rooms = await RoomModel.find(filter).sort({ pricePerNight: 1 });
    
    res.json({ rooms });
  } catch (error) {
    console.error("Get available rooms error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get room statistics
export const getRoomStatistics = async (req, res) => {
  try {
    const stats = await RoomModel.aggregate([
      {
        $group: {
          _id: null,
          totalRooms: { $sum: 1 },
          availableRooms: {
            $sum: { $cond: [{ $eq: ["$status", "Available"] }, 1, 0] }
          },
          occupiedRooms: {
            $sum: { $cond: [{ $eq: ["$status", "Occupied"] }, 1, 0] }
          },
          maintenanceRooms: {
            $sum: { $cond: [{ $eq: ["$status", "Maintenance"] }, 1, 0] }
          },
          cleaningRooms: {
            $sum: { $cond: [{ $eq: ["$status", "Cleaning"] }, 1, 0] }
          }
        }
      }
    ]);

    const roomTypeStats = await RoomModel.aggregate([
      {
        $group: {
          _id: "$roomType",
          count: { $sum: 1 },
          averagePrice: { $avg: "$pricePerNight" }
        }
      }
    ]);

    res.json({
      overall: stats[0] || {
        totalRooms: 0,
        availableRooms: 0,
        occupiedRooms: 0,
        maintenanceRooms: 0,
        cleaningRooms: 0
      },
      byType: roomTypeStats
    });
  } catch (error) {
    console.error("Get room statistics error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

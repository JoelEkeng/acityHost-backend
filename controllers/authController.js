const User = require('../models/User');

exports.register = async (req, res) => {
  try {
    console.log("Register API hit:", req.body);

    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      console.log("Missing fields:", { fullName, email, password });
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists:", email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ fullName, email, password, role });

    await user.save();

    console.log("User saved successfully:", user);

    const token = user.generateAuthToken();
    
    res.status(201).json({
      user: { id: user.id, fullName, email, role: user.role },
      token
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = user.generateAuthToken();
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });
    res.status(200).json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        roomNumber: user.roomNumber,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

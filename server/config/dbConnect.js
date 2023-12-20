const { default: mongoose } = require('mongoose');

// Connect to DB
const dbConnect = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    // check conn == 1 is connected, 0 is disconnected, 3 is connecting
    if (conn.connection.readyState === 1)
      console.log('DB connection is successfully');
    else console.log('DB Connection is failed');
  } catch (error) {
    console.log('DB connection is ' + error);
  }
};

module.exports = dbConnect;

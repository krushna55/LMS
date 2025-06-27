import mongoose, { connect } from "mongoose";

mongoose.set("strictQuery", false); // extra query will be ignonred not going to throw the exceptionS

const connectiontodb = async () => {
  try {
    const { connection } = await mongoose.connect(process.env.MONGO_URI);
    if (connection) {
      console.log(`connected to db ${connection.host}`);
    }
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

export default connectiontodb;

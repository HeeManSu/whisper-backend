import mongoose from "mongoose"

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB connected with ${mongoose.connection.host}`);
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
};
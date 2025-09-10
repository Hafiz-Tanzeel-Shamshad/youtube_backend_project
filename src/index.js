import dotenv from 'dotenv'
import connectDB from './db/index.js';
import { app } from './app.js';


dotenv.config({ 
    path: './.env',
    override: true,
    quiet: true
});

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 5000, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
})
.catch((error) => {
    console.error("Database connection failed! ", error);
});








/*
(async()=>{
    try {
       await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`);

        //if express not listen mongosee throw error
        app.on("error", (err) => {  
            console.log("ERROR: ", err);
            throw err;
        });

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    }
     catch (error) {
        console.log("ERROR: ", error);
        throw error;

    }
})()

*/
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import userRoutes from './routes/userRoutes.js'
import courseRoutes from './routes/courseRoutes.js'
import errormiddleware from './middleware/errormiddleware.js'

const app = express()
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cors({
    origin:[process.env.FRONTEND_URL],
    credentials:true
}))
app.use(cookieParser())
app.use(morgan("dev"))

// app.use('/ping',(req,res)=>{
//     res.send('/pong')
// })
app.use('/api/v1/user',userRoutes)
app.use('/api/v1/course',courseRoutes)


// Handles all unmatched routes — works safely in Node.js v24+
app.use((req, res) => {
  res.status(404).send('OOPS! 404 page not found');
});

app.use(errormiddleware)


export default app;
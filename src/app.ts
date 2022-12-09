import express from 'express'
import Route from './routes'
import bodyParser from 'body-parser';
import swagger from './swagger/index'

require('dotenv').config()

const app = express()

app.use(bodyParser.json());    
app.use('/identrust/swagger',swagger)
app.use('/identrust', Route)

app.get('/', (req, res) => {
    return res.send('Identrust Homepage')
})

const PORT = process.env.PORT
app.listen(PORT, ()=>{
    console.log(`App is listeneing on http://localhost:${PORT}`)
    console.log(`Swagger-Document is on http://localhost:${PORT}/identrust/swagger`)
})
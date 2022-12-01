import express from 'express'
import Route from './routes'
import bodyParser from 'body-parser';
const app = express()

app.use(bodyParser.json());    

app.use('/identrust', Route)

app.get('/', (req, res) => {
    return res.send('Identrust Homepage')
})

app.listen(3000, ()=>{
    console.log('App is listeneing on http://localhost:3000')
})
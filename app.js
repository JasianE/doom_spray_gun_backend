const express = require('express');
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");
const {SerialPort} = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');


const app = express();
app.use(cors())
app.use(express.json());

let total_distractions = 0;
const PORT = process.env.PORT || 5000;

const port = new SerialPort({
  path: '/dev/ttyACM0', 
  baudRate: 9600,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));


// Scraper
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

app.post("/scrape", async (req, res) => {
    const data = req.body;
    const extra_urls = req.body.extra_urls; // The urls that the user has blocked themselves
    const the_url = req.body.the_url; // The url that the user is currently accessing 
    let isTheWebsiteDistracting = false; // Changes to true value if the url user is accesing is in extra_urls
    try {
      const response = await axios.get(the_url);
      const html = response.data; // parse the html and load it into cheerio
      const $ = cheerio.load(html); 
      $('video').each((index, element) => {
        total_distractions = total_distractions + 5; //make videos worth 300 times
      })
      $('img').each((index, element) => {
        total_distractions = total_distractions+3
      })
      for(let i = 0; i < extra_urls.length; i++){
        console.log(extra_urls[i], the_url)
        if(extra_urls[i] == the_url){
          isTheWebsiteDistracting = true;
        }
      }


      if(total_distractions >30 || isTheWebsiteDistracting){ //change this in code demo to show how the backend works
        res.send('Distracting')
        port.write('push\n')
      } else {
        res.send('Good')
      }
    } catch (error) {
      res.status(500).json({ message: "Error accessing the URL" });
    }
  });

  process.on('SIGINT', () => {
    console.log('Closing serial port...');
    port.close((err) => {
      if (err) {
        console.error('Error closing port:', err.message);
      } else {
        console.log('Serial port closed');
        process.exit(0);
      }
    });
  });


  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
    port.close(() => process.exit(1));
  });
  
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    port.close(() => process.exit(1));
  });
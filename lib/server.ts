import * as dotenv from "dotenv";
import app from "./app";
import * as bodyParser from 'body-parser';

// Add to Process.ENV
dotenv.config();

// middleware for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));

// middleware for json body parsing
app.use(bodyParser.json({limit: '5mb'}));

app.listen(Number(process.env.SERVER_PORT!), () => {
});

process.on("SIGINT", function() {
  console.log("App Shutting Down");
});

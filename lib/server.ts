import * as config from './config/server'
import {app} from "./app";
import * as bodyParser from 'body-parser';

// middleware for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));

// middleware for json body parsing
app.use(bodyParser.json({limit: '5mb'}));

app.listen(config.Server.Port, config.Server.Name, () => {
});

process.on("SIGINT", function() {
  console.log("App Shutting Down");
});

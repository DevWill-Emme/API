const express = require("express");
const app = express();
const port = process.env.port || 3001;
const bodyParser = require("body-parser");
const cors = require("cors");
/*const knex = require("knex")({
  client: "sqlite3",
  connection: {
    filename: "./MyInn.db",
  },
  useNullAsDefault: true,
});*/

app.use(bodyParser.json());
app.use(cors());

/*app.get("/servicios", (req, res) => {
  knex
    .select("*")
    .from("Servicio")
    .then((ser) => res.json(ser));
});*/

app.listen(port);

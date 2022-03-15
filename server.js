const express = require("express");
const port = process.env.port || 3001;
const bodyParser = require("body-parser");
const cors = require("cors");
const knex = require("knex")({
  client: "pg",
  connection: {
    host: "localhost",
    user: "postgres",
    password: "0123",
    database: "postgres",
  },
  useNullAsDefault: true,
});

//SERVER
const app = express();
app.use(bodyParser.json());
app.use(cors());

//POSTS
app.post("/Servicio", (req, res) => {
  const { sexo, nombre, ci, tiempo } = req.body;

  knex.transaction((trx) => {
    trx("servicio")
      .insert({
        nombre: nombre,
        ci: ci,
        sexo: sexo,
        tiempo: `${Number(tiempo)}`,
        importetotal: 0,
        fecha: `${new Date().toUTCString()}`,
      })
      .then(() => {
        return trx("servicio").where({ ci: ci }).update({ sexo: sexo });
      })
      .then((data) => {
        return trx
          .select("*")
          .from("clientes")
          .where("CI", "=", ci)
          .then((dat) => {
            if (dat.length === 0) {
              return trx("clientes").insert({
                CI: ci,
                Nombre: nombre,
                Sexo: sexo,
                Entradas: 1,
              });
            } else {
              return trx("clientes")
                .where("CI", "=", ci)
                .increment("Entradas", 1);
            }
          })
          .catch((err) => res.status(400).json(err))
          .then(res.json({ Request: true }));
      })
      .then(trx.commit);
  });
});

//GETS
app.get("/", (req, res)=>{
  res.send("API cool!!")
});

app.get("/servicios", (req, res) => {
  knex
    .select("*")
    .from("servicio")
    .then((ser) => res.json(ser));
});
app.get("/clientes", (req, res) => {
  knex
    .select("*")
    .from("clientes")
    .then((clie) => res.json(clie));
});

//DELETE
app.delete("/del/servicios", (req, res) => {
  const { key } = req.body;

  knex.transaction((trx) => {
    trx
      .select("ci")
      .from("servicio")
      .where({ idservicio: key })
      .then((data) => {
        return trx("servicio")
          .where({ idservicio: key })
          .del()
          .then(() => {
            return trx("clientes")
              .where({ CI: data[0].CI })
              .decrement("Entradas", 1)
              .then(() => {
                return trx("clientes").where("Entradas", "<=", 0).del();
              });
          })
          .then((resp) => res.json("done"))
          .catch((err) => res.status(400).json(err));
      })
      .then(trx.commit)
      .catch(trx.rollback);
  });
});

app.delete("/del/clientes", (req, res) => {
  const { key } = req.body;

  knex.transaction((trx) => {
    trx("clientes")
      .where({ CI: key })
      .del()
      .then(() => {
        return trx("servicio")
          .where({ ci: key })
          .del()
          .then((resp) => res.json("done"))
          .catch((err) => res.status(400).json(err));
      })
      .then(trx.commit)
      .catch(trx.rollback);
  });
});

//PUT

app.put("/edit/Servicios", (req, res) => {
  const { key, nombre, ci, sexo, importe, tiempo } = req.body;
  //-- no se porque lo hice asi xD
  // hay q trabajar en esto definitivamente
  knex.transaction((trx) => {
    trx
      .select("ci")
      .from("servicio")
      .where({ idservicio: key })
      .then((data) => {
        return trx("servicio")
          .where({ idservicio: key })
          .update({
            nombre: nombre,
            ci: ci,
            importetotal: importe,
            tiempo: tiempo,
          })
          .then(() => {
            return trx("servicio").where({ ci: ci }).update({ sexo: sexo });
          })
          .then(() => {
            return trx("clientes")
              .where({ CI: data[0].ci })
              .decrement("Entradas", 1)
              .then(() => {
                return trx("clientes")
                  .where("Entradas", "<=", 0)
                  .del()
                  .then(() => {
                    return trx("clientes")
                      .where({ CI: ci })
                      .then((response) => {
                        if (response.length === 0) {
                          return trx("clientes").insert({
                            CI: ci,
                            Nombre: nombre,
                            Entradas: 1,
                            Sexo: sexo,
                          });
                        } else {
                          return trx("clientes")
                            .where({ CI: ci })
                            .update({ Sexo: sexo })
                            .increment("Entradas", 1);
                        }
                      })
                      .then((resp) => res.json("done"))
                      .catch((err) => res.status(400).json(err));
                  });
              });
          });
      })
      .then(trx.commit)
      .catch(trx.rollback);
  });
});

app.put("/edit/Clientes", (req, res) => {
  const { key, nombre, ci, sexo } = req.body;
  knex.transaction((trx) => {
    trx("clientes")
      .where({ CI: key })
      .update({
        Nombre: nombre,
        CI: ci,
        Sexo: sexo,
      })
      .then(() => {
        return trx("servicio")
          .where({ ci: key })
          .update({ ci: ci, sexo: sexo })
          .then((resp) => res.json("done"))
          .catch((err) => res.status(400).json(err));
      })
      .then(trx.commit)
      .catch(trx.rollback);
  });
});

app.put("/importe", (req, res) => {
  const { key, importe } = req.body;

  knex("servicio")
    .where({ idservicio: key })
    .update({ importetotal: importe })
    .then((resp) => res.json());
});

app.listen(port);

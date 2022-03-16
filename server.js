const express = require("express")
const port = process.env.PORT || 3001;
const bodyParser = require("body-parser")
const cors = require("cors")
const knex = require('knex')({
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl:true
  },
  useNullAsDefault: true
});

//SERVIDOR
const app = express();

app.use(bodyParser.json());
app.use(cors());

//POST
app.post('/Servicio',(req,res)=>{
  const { sexo,nombre,ci,tiempo }=req.body
  
  knex.transaction( trx =>{
    trx('Servicio').insert({
      Nombre: nombre,
      CI: ci,
      Sexo: sexo,
      Tiempo: `${Number(tiempo)}`,
      ImporteTotal: 0,
      Fecha: `${new Date().toUTCString()}`
    })
    .then(()=>{
      return trx('Servicio').where({CI:ci})
      .update({Sexo:sexo})
    })
    .then(data => {
      return trx.select('*').from('clientes').where('CI','=', ci)
      .then(dat=>{
        if (dat.length === 0) {
          return trx('clientes').insert({CI:ci,Nombre:nombre,Sexo:sexo,Entradas:1})
        } else {
          return trx('clientes').where('CI','=', ci).increment('Entradas', 1)
        }
      })
      .then(res.json({Request: true}))
      .catch(err => res.status(400).json(err))
    })
    .then(trx.commit)
  })
})

//GET
app.get('/', (req,res)=>{
  res.send('API cool!!')
}).catch(err => res.send(err));

app.get('/servicios', (req,res)=>{
  knex.select('*').from('Servicio') 
    .then(ser=> res.json(ser))
    .catch(err => res.send(err))
});

app.get('/clientes', (req,res)=>{
  knex.select('*').from('clientes') 
    .then(clie=> res.json(clie))
})

//DELETE
app.delete('/del/servicios',(req,res)=>{
  const { key } = req.body

  knex.transaction(trx => {
    trx.select('CI').from('Servicio').where({IDServicio:key})
    .then(data=>{
      return trx('Servicio').where({IDServicio:key}).del()
      .then(()=>{
        return trx('clientes').where({CI: data[0].CI})
        .decrement('Entradas', 1)
        .then(()=>{
          return trx('clientes').where('Entradas','<=', 0).del()
        })
      })
      .then(resp => res.json('done'))
      .catch(err => res.status(400).json(err))
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
})

app.delete('/del/clientes',(req,res)=>{
  const { key } = req.body
  
  knex.transaction(trx => {
    trx('clientes').where({CI:key}).del()
    .then(()=>{
      return trx('Servicio').where({CI:key}).del()
      .then(resp => res.json('done'))
      .catch(err => res.status(400).json(err))
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
})

// PUT
app.put('/edit/Servicios',(req,res)=>{
  const { key,nombre,ci,sexo,importe,tiempo } = req.body

  knex.transaction(trx => {
    trx.select('CI').from('Servicio').where({ IDServicio: key})
    .then(data => {
      return trx('Servicio').where({ IDServicio: key})
      .update({
        Nombre: nombre,
        CI: ci,
        ImporteTotal: importe,
        tiempo: tiempo
      })
      .then(()=>{
        return trx('Servicio').where({CI:ci})
        .update({Sexo:sexo})
      })
      .then(()=>{
        return trx('clientes').where({ CI: data[0].CI})
        .decrement('Entradas', 1)
        .then(()=>{
          return trx('clientes').where('Entradas', '<=', 0).del()
          .then(()=>{
            return trx('clientes').where({ CI: ci})
            .then(response => {
              if(response.length === 0){
                return trx('clientes').insert({CI:ci,Nombre:nombre,Entradas:1,Sexo:sexo})
              } else {
                return trx('clientes').where({ CI: ci})
                .update({Sexo:sexo})
                .increment('Entradas', 1)
              }
            })
            .then(resp => res.json('done'))
            .catch(err => res.status(400).json(err))
          })
        })
      })
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
  
})

app.put('/edit/Clientes',(req,res)=>{
  const { key,nombre,ci,sexo } = req.body
  knex.transaction(trx => {
    trx('clientes').where({CI:key})
    .update({
      Nombre: nombre,
      CI: ci,
      Sexo: sexo
    })
    .then(()=>{
      return trx('Servicio').where({CI:key})
      .update({CI: ci, Sexo:sexo})
      .then(resp => res.json('done'))
      .catch(err => res.status(400).json(err))
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
})

app.put('/importe',(req,res)=>{
  const { key,importe } = req.body
  knex('Servicio').where({IDServicio: key})
  .update({ImporteTotal: importe})
  .then(resp => res.json())
})

app.listen(port) 
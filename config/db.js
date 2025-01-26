const Sequelize = require("sequelize");
const sequelize = new Sequelize("wt24", "root", "password", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Učitavanje modela
db.korisnik = require(__dirname + "/../models/korisnik")(sequelize, Sequelize.DataTypes);
db.nekretnina = require(__dirname + "/../models/nekretnina")(sequelize, Sequelize.DataTypes);
db.upit = require(__dirname + "/../models/upit")(sequelize, Sequelize.DataTypes);
db.zahtjev = require(__dirname + "/../models/zahtjev")(sequelize, Sequelize.DataTypes);
db.ponuda = require(__dirname + "/../models/ponuda")(sequelize, Sequelize.DataTypes);

// Definisanje relacija između modela

// Korisnik i Upit
db.korisnik.hasMany(db.upit, { foreignKey: 'korisnikId' });
db.upit.belongsTo(db.korisnik, { foreignKey: 'korisnikId' });

// Korisnik i Ponuda
db.korisnik.hasMany(db.ponuda, { foreignKey: 'korisnikId' });
db.ponuda.belongsTo(db.korisnik, { foreignKey: 'korisnikId' });

//Korisnik i Zahtjev
db.korisnik.hasMany(db.zahtjev, { foreignKey: 'korisnikId' });
db.zahtjev.belongsTo(db.korisnik, { foreignKey: 'korisnikId' });

// Nekretnina i Upit
db.nekretnina.hasMany(db.upit, { foreignKey: 'nekretninaId' });
db.upit.belongsTo(db.nekretnina, { foreignKey: 'nekretninaId' });

// Nekretnina i Zahtjev
db.nekretnina.hasMany(db.zahtjev, { foreignKey: 'nekretninaId' });
db.zahtjev.belongsTo(db.nekretnina, { foreignKey: 'nekretninaId' });

// Nekretnina i Ponuda
db.nekretnina.hasMany(db.ponuda, { foreignKey: 'nekretninaId' });
db.ponuda.belongsTo(db.nekretnina, { foreignKey: 'nekretninaId' });

// Ponuda i Ponuda (vezane ponude)
db.ponuda.hasMany(db.ponuda, { foreignKey: 'ponudaId', as: 'vezanePonude' }); // Vezane ponude za ovu ponudu
db.ponuda.belongsTo(db.ponuda, { foreignKey: 'ponudaId', as: 'originalPonuda' });  // Originalna ponuda

// Proveri konekciju sa bazom podataka
sequelize.authenticate()
  .then(() => {
    console.log('Konekcija sa bazom podataka je uspešna.');
  })
  .catch(err => {
    console.error('Greška pri povezivanju sa bazom podataka:', err);
  });

// Sinhronizacija sa bazom podataka
sequelize.sync({ force: false }) 
.then(() => {
  console.log('Tabele su uspešno sinhronizovane.');
})
.catch((err) => {
  console.error('Greška prilikom sinhronizacije:', err);
});



module.exports = db;

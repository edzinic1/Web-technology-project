const express = require('express');
const session = require("express-session");
const path = require('path');
const fs = require('fs').promises; // Using asynchronus API for file read and write
const bcrypt = require('bcrypt');
const db = require("./config/db.js");

const app = express();
const PORT = 3000;

app.use('/Scripts', express.static('Scripts')); 
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.use("/scripts", express.static(path.join(__dirname, "public/scripts")));
app.use(express.static(path.join(__dirname, "public/html")));


app.use(session({
  secret: 'tajna sifra',
  resave: true,
  saveUninitialized: true
}));

db.sequelize.sync({ force: false }).then(async () => { 
  try {
    await initialize();  
    console.log("Završeno kreiranje korisnika!");
  } catch (error) {
    console.error("Greška:", error);
  }
});

async function initialize() {
  
  await db.korisnik.findOrCreate({
    where: { username: 'admin' },  
    defaults: {  
      ime: "Admin",
      prezime: "Admin",
      username: "admin",
      password: await bcrypt.hash('admin', 10),  
      admin: true,  
    }
  });

  await db.korisnik.findOrCreate({
    where: { username: 'user' },  
    defaults: {  
      ime: "User",
      prezime: "User",
      username: "user",
      password: await bcrypt.hash('user', 10),  
      admin: false,  
    }
  });

 
 const nekretnine = [
  {
    tip_nekretnine: "Stan",
    naziv: "Useljiv stan Sarajevo",
    kvadratura: 58,
    cijena: 232000,
    tip_grijanja: "plin",
    lokacija: "Novo Sarajevo",
    godina_izgradnje: 2019,
    datum_objave: new Date("2023-10-01"), 
    opis: "Sociis natoque penatibus."
  },
  {
    tip_nekretnine: "Poslovni prostor",
    naziv: "Mali poslovni prostor",
    kvadratura: 20,
    cijena: 70000,
    tip_grijanja: "struja",
    lokacija: "Centar",
    godina_izgradnje: 2005,
    datum_objave: new Date("2023-08-20"), 
    opis: "Magnis dis parturient montes."
  }
];



for (const nekretnina of nekretnine) {
  await db.nekretnina.findOrCreate({
    where: { naziv: nekretnina.naziv },  
    defaults: nekretnina                
  });
}

console.log("Korisnici i nekretnine su dodani ako nisu već postojali.");

}

app.use(express.static(__dirname + '/public'));

// Enable JSON parsing without body-parser
app.use(express.json());


/* ---------------- SERVING HTML -------------------- */

// Async function for serving html files

async function serveHTMLFile(req, res, fileName) {
  const htmlPath = path.join(__dirname, 'public/html', fileName);
  try {
    const content = await fs.readFile(htmlPath, 'utf-8');
    res.send(content);
  } catch (error) {
    console.error('Error serving HTML file:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
}


// Array of HTML files and their routes
const routes = [
  { route: '/nekretnine.html', file: 'nekretnine.html' },
  { route: '/detalji.html', file: 'detalji.html' },
  { route: '/meni.html', file: 'meni.html' },
  { route: '/', file: 'meni.html' },
  { route: '/prijava.html', file: 'prijava.html' },
  { route: '/profil.html', file: 'profil.html' },
  { route: '/vijesti.html', file: 'vijesti.html'},
  { route: '/mojiUpiti.html', file: 'mojiUpiti.html'}
  // Practical for adding more .html files as the project grows
];

// Loop through the array so HTML can be served
routes.forEach(({ route, file }) => {
  app.get(route, async (req, res) => {
    await serveHTMLFile(req, res, file);
  });
});


/* ----------- SERVING OTHER ROUTES --------------- */

// Async function for reading json data from data folder
async function readJsonFile(filename) {
  const filePath = path.join(__dirname, 'data', `${filename}.json`);
  try {
    const rawdata = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(rawdata);
  } catch (error) {
    throw error;
  }
}

// Async function for reading json data from data folder
async function saveJsonFile(filename, data) {
  const filePath = path.join(__dirname, 'data', `${filename}.json`);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    throw error;
  }
}

/*
Checks if the user exists and if the password is correct based on korisnici.json data.
If the data is correct, the username is saved in the session and a success message is sent.
*/

const loginAttempts = new Map();
const LOGIN_LIMIT = 3;
const BLOCK_TIME = 60 * 1000;


async function logPrijava(username, status) {
  const datumVrijeme = new Date().toISOString();
  const logPoruka = `[${datumVrijeme}] - username: "${username}" - status: "${status}"
`;

  try {
    await fs.appendFile(path.join(__dirname, 'data', 'prijave.txt'), logPoruka, 'utf-8');
  } catch (error) {
    console.error('Greška prilikom logovanja prijave:', error);
  }
}


app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const trenutniTrenutak = Date.now();

  try {
    if (loginAttempts.has(username)) {
      const korisnikPodaci = loginAttempts.get(username);
      if (
        korisnikPodaci.brojPokusaja >= LOGIN_LIMIT &&
        trenutniTrenutak - korisnikPodaci.zadnjiPokusaj < BLOCK_TIME
      ) {
        await logPrijava(username, 'neuspješno');
        return res
          .status(429)
          .json({ greska: 'Previse neuspjesnih pokusaja. Pokusajte ponovo za 1 minutu.' });
      }
    }

    
    const korisnik = await db.korisnik.findOne({
      where: { username: username },
    });

    if (!korisnik) {
      await logPrijava(username, 'neuspješno');

      if (!loginAttempts.has(username)) {
        loginAttempts.set(username, { brojPokusaja: 1, zadnjiPokusaj: trenutniTrenutak });
      } else {
        const korisnikPodaci = loginAttempts.get(username);
        korisnikPodaci.brojPokusaja++;
        korisnikPodaci.zadnjiPokusaj = trenutniTrenutak;
      }

      return res.status(401).json({ poruka: 'Neuspješna prijava' });
    }

    
    const isPasswordMatched = await bcrypt.compare(password, korisnik.password);

    if (!isPasswordMatched) {
      await logPrijava(username, 'neuspješno');

      
      if (!loginAttempts.has(username)) {
        loginAttempts.set(username, { brojPokusaja: 1, zadnjiPokusaj: trenutniTrenutak });
      } else {
        const korisnikPodaci = loginAttempts.get(username);
        korisnikPodaci.brojPokusaja++;
        korisnikPodaci.zadnjiPokusaj = trenutniTrenutak;
      }

      return res.status(401).json({ poruka: 'Neuspješna prijava' });
    }

    
    loginAttempts.delete(username);
    await logPrijava(username, 'uspješno');
    req.session.username = korisnik.username;
    res.status(200).json({ poruka: 'Uspješna prijava' });
  } catch (error) {
    console.error('Greška tokom prijave:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});


app.post('/logout', async (req, res) => {
  if (!req.session.username) {
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  try {
    await logPrijava(req.session.username, 'odjava');

    req.session.destroy((err) => {
      if (err) {
        console.error('Error during logout:', err);
        return res.status(500).json({ greska: 'Internal Server Error' });
      } else {
        return res.status(200).json({ poruka: 'Uspješno ste se odjavili' });
      }
    });
  } catch (error) {
    console.error('Greška tokom odjave:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.get('/korisnik', function (req, res) {
  if (req.session.username) {
    db.korisnik
      .findOne({
        where: { username: req.session.username },
        attributes: ['id', 'ime', 'prezime', 'username', 'password', 'admin'], // Uključujemo i password
      })
      .then(function (loggedInUser) {
        if (loggedInUser) {
          res.status(200).json(loggedInUser);
        } else {
          res.status(401).json({ greska: 'Neautorizovan pristup' });
        }
      })
      .catch(function (err) {
        console.error('Greška prilikom dohvatanja korisnika iz baze:', err);
        res.status(500).json({ greska: 'Internal Server Error' });
      });
  } else {
    res.status(401).json({ greska: 'Neautorizovan pristup' });
  }
});

app.get('/upiti/moji', async (req, res) => {
  if (!req.session.username) {
    console.log('Korisnik nije ulogovan!');
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  const username = req.session.username;
  console.log(`Korisnik ulogovan: ${username}`);

  try {
    const korisnik = await db.korisnik.findOne({
      where: { username },
      attributes: ['id'], 
    });

    if (!korisnik) {
      console.log(`Korisnik sa username "${username}" nije pronađen!`);
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
    }

    console.log(`Korisnik pronađen: ${korisnik.id}`);

    const korisnikovUpiti = await db.upit.findAll({
      where: { korisnikId: korisnik.id },
      attributes: ['tekst', 'nekretninaId'], 
    });

    console.log(`Broj upita korisnika: ${korisnikovUpiti.length}`);

    if (korisnikovUpiti.length === 0) {
      return res.status(404).json([]); 
    }

    const odgovor = korisnikovUpiti.map((upit) => ({
      nekretninaId: upit.nekretninaId,
      tekst_upita: upit.tekst,
    }));

    console.log('Odgovor:', odgovor);
    res.status(200).json(odgovor);
  } catch (error) {
    console.error('Greška prilikom obrade upita:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

const upitiPoKorisniku = new Map();

app.post('/upit', async (req, res) => {
  if (!req.session.username) {
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  const { nekretnina_id, tekst_upita } = req.body;

  try {
    const korisnik = await db.korisnik.findOne({
      where: { username: req.session.username },
    });

    if (!korisnik) {
      return res.status(400).json({ greska: 'Korisnik ne postoji' });
    }

    const nekretnina = await db.nekretnina.findOne({
      where: { id: nekretnina_id },
    });

    if (!nekretnina) {
      return res.status(400).json({ greska: `Nekretnina sa id-em ${nekretnina_id} ne postoji` });
    }

    const brojUpitaZaNekretninu = await db.upit.count({
      where: {
        korisnikId: korisnik.id,
        nekretninaId: nekretnina.id,
      },
    });

    if (brojUpitaZaNekretninu >= 3) {
      return res.status(429).json({ greska: 'Previše upita za istu nekretninu.' });
    }

    await db.upit.create({
      tekst: tekst_upita,
      nekretninaId: nekretnina.id,
      korisnikId: korisnik.id,
    });

    res.status(200).json({ poruka: 'Upit je uspješno dodan' });
  } catch (error) {
    console.error('Greška prilikom obrade upita:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});


app.put("/korisnik", async function (req, res) {
  try {
    if (!req.session.username) {
      return res.status(401).json({ greska: "Neautorizovan pristup" });
    }

    const { ime, prezime, username, password, admin } = req.body;

    const loggedInUser = await db.korisnik.findOne({
      where: { username: req.session.username },
    });

    if (!loggedInUser) {
      return res.status(500).json({ greska: "Internal Server Error" });
    }

    if (ime) loggedInUser.ime = ime;
    if (prezime) loggedInUser.prezime = prezime;
    if (username) loggedInUser.username = username;
    if (password) loggedInUser.password = password;
    if (admin) loggedInUser.admin = admin;

    await loggedInUser.save();

    return res.status(200).json({ poruka: "Podaci su uspješno ažurirani" });
  } catch (error) {
    console.error("Greška:", error);
    return res.status(500).json({ greska: "Internal Server Error" });
  }
});

app.get('/nekretnina/:id', async (req, res) => {
  const nekretninaId = req.params.id;

  try {
    const nekretnina = await db.nekretnina.findOne({
      where: { id: nekretninaId },
    });

    if (!nekretnina) {
      return res.status(404).json({ greska: `Nekretnina sa id-om ${nekretninaId} nije pronađena.` });
    }

    const upiti = await db.upit.findAll({
      where: { nekretninaId: nekretninaId }, 
      order: [['id', 'DESC']], 
      limit: 3, 
    });

    const detaljiNekretnine = {
      id: nekretnina.id,
      naziv: nekretnina.naziv,
      lokacija: nekretnina.lokacija,
      cijena: nekretnina.cijena,
      upiti: upiti.map(upit => ({
        tekst: upit.tekst,
        korisnikId: upit.korisnikId,
      }))
    };

    res.status(200).json(detaljiNekretnine);
  } catch (error) {
    console.error('Greška prilikom dohvaćanja detalja nekretnine:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.get('/next/upiti/nekretnina:id', async (req, res) => {
  const nekretninaId = req.params.id;  
  const page = parseInt(req.query.page); 

  if (page <= 0) {
    return res.status(400).json({ greska: 'Nevažeći broj stranice. Stranica mora biti >= 1.' });
  }

  try {
    if (!db.nekretnina) {
      return res.status(500).json({ greska: 'Model nekretnina nije definisan.' });
    }

    const nekretnina = await db.nekretnina.findByPk(nekretninaId);

    if (!nekretnina) {
      return res.status(404).json({ greska: `Nekretnina sa id-om ${nekretninaId} nije pronađena.` });
    }

    const upitiPerPage = 3; 
    const offset = (page - 1) * upitiPerPage; 

    const upiti = await db.upit.findAll({
      where: {
        nekretninaId: nekretninaId, 
      },
      limit: upitiPerPage, 
      offset: offset, 
      order: [['id', 'DESC']], 
    });

    res.status(200).json(upiti);
  } catch (error) {
    console.error('Greška prilikom obrade zahtjeva:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.get('/nekretnine', async (req, res) => {
  try {
    const nekretnineData = await db.nekretnina.findAll(); 

    if (nekretnineData.length === 0) {
      return res.status(404).json({ greska: 'Nema podataka o nekretninama.' });
    }

    res.json(nekretnineData);
  } catch (error) {
    console.error('Greška prilikom dohvaćanja podataka o nekretninama:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.get('/nekretnine/top5', async (req, res) => {
  const { lokacija } = req.query;

  if (!lokacija) {
    return res.status(400).json({ greska: 'Lokacija nije navedena.' });
  }

  try {
    if (!db.nekretnina) {
      return res.status(500).json({ greska: 'Model nekretnina nije definisan.' });
    }

    const topNekretnine = await db.nekretnina.findAll({
      where: {
        lokacija: lokacija.toLowerCase(), // Usporedba prema lokaciji (osjetljivo na mala/velika slova)
      },
      order: [['datum_objave', 'DESC']], // Sortiraj po datumu objave silazno
      limit: 5, // Ograniči na top 5
    });

    if (topNekretnine.length === 0) {
      return res.status(404).json({ poruka: 'Nema nekretnina za zadanu lokaciju.' });
    }

    res.status(200).json(topNekretnine);
  } catch (error) {
    console.error('Greška prilikom obrade zahtjeva za top 5 nekretnina:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});


/* ----------------- 4. spirala rute  ----------------- */

app.get('/nekretnina/:id/interesovanja', async (req, res) => {
  const username = req.session?.username; 
  console.log(`Korisnik ulogovan: ${username || 'nije ulogovan'}`);

  try {
      let korisnik = null;

      if (username) {
          korisnik = await db.korisnik.findOne({
              where: { username },
              attributes: ['id', 'admin'], 
          });

          if (!korisnik) {
              return res.status(401).json({ greska: 'Neautorizovan pristup' });
          }

          console.log(`Korisnik pronađen: ${korisnik.id}, admin: ${korisnik.admin}`);
      }

      const nekretninaId = req.params.id;

      const nekretnina = await db.nekretnina.findByPk(nekretninaId);

      if (!nekretnina) {
          return res.status(404).json({ error: 'Nekretnina nije pronađena' });
      }

      const [upiti, zahtjevi, ponude] = await Promise.all([
          db.upit.findAll({ where: { nekretninaId } }),
          db.zahtjev.findAll({ where: { nekretninaId } }),
          db.ponuda.findAll({ where: { nekretninaId } }),
      ]);

      if (!korisnik) {
          const anonimnePonude = ponude.map((ponuda) => {
              const { cijenaPonude, ...ostalo } = ponuda.toJSON();
              return ostalo;
          });

          return res.json({
              upiti,
              zahtjevi,
              ponude: anonimnePonude,
          });
      }

      if (korisnik.admin) {
          return res.json({ upiti, zahtjevi, ponude });
      }

      const korisnikovePonude = ponude.filter((ponuda) => ponuda.korisnikId === korisnik.id);
      const korisnikoviIdjevi = korisnikovePonude.map((p) => p.id); 

      const filtriranePonude = ponude.map((ponuda) => {
          const jeVlasnikPonude = korisnikoviIdjevi.includes(ponuda.id); 
          const jeVezanaZaKorisnikovuPonudu = korisnikoviIdjevi.includes(ponuda.ponudaId); 

          if (!jeVlasnikPonude && !jeVezanaZaKorisnikovuPonudu) {
              const { cijenaPonude, ...ostalo } = ponuda.toJSON();
              return ostalo;
          }

          return ponuda;
      });

      return res.json({
          upiti,
          zahtjevi,
          ponude: filtriranePonude,
      });
  } catch (error) {
      console.error('Greška na serveru:', error);
      return res.status(500).json({ greska: 'Internal Server Error' });
  }
});


app.post('/nekretnina/:id/ponuda', async (req, res) => {
  const username = req.session?.username; 
  if (!username) {
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  try {
      
      const korisnik = await db.korisnik.findOne({
          where: { username },
          attributes: ['id', 'admin'], 
      });

      if (!korisnik) {
          return res.status(401).json({ greska: 'Neautorizovan pristup' });
      }

      const nekretninaId = req.params.id;
      const { tekst, ponudaCijene, datumPonude, idVezanePonude, odbijenaPonuda } = req.body;

      
      const nekretnina = await db.nekretnina.findByPk(nekretninaId);
      if (!nekretnina) {
          return res.status(404).json({ greska: 'Nekretnina nije pronađena' });
      }

      let vezanaPonuda = null;
      let korisnikZaKojiProveravamo = korisnik.id;

      
      if (idVezanePonude) {
          vezanaPonuda = await db.ponuda.findByPk(idVezanePonude);

          if (!vezanaPonuda) {
              return res.status(400).json({ greska: 'Vezana ponuda nije pronađena' });
          }

          let currentPonuda = vezanaPonuda;
          while (currentPonuda) {
              if (currentPonuda.odbijenaPonuda) {
                  return res.status(403).json({
                      greska: 'Ne možete dodati novu ponudu jer je neka od povezanih ponuda odbijena.',
                  });
              }
              currentPonuda = await db.ponuda.findByPk(currentPonuda.ponudaId);
          }

          while (vezanaPonuda.ponudaId) {
              vezanaPonuda = await db.ponuda.findByPk(vezanaPonuda.ponudaId);
              if (!vezanaPonuda) {
                  return res.status(400).json({ greska: 'Povezane ponude nisu pronađene' });
              }
          }

          if (!korisnik.admin && vezanaPonuda.korisnikId !== korisnik.id) {
              return res.status(403).json({
                  greska: 'Nemate ovlašćenje za dodavanje ponude na ovu vezanu ponudu.',
              });
          }
      }

      const novaPonuda = await db.ponuda.create({
          tekst,
          cijenaPonude: ponudaCijene,
          datumPonude,
          nekretninaId,
          korisnikId: korisnik.id,
          ponudaId: idVezanePonude || null,  
          odbijenaPonuda: !!odbijenaPonuda,
      });

      if (odbijenaPonuda) {
          let currentPonuda = novaPonuda;
          
          while (currentPonuda.ponudaId) {
              const prethodnaPonuda = await db.ponuda.findByPk(currentPonuda.ponudaId);
              if (!prethodnaPonuda) {
                  break;  
              }
              await prethodnaPonuda.update({ odbijenaPonuda: true });
              currentPonuda = prethodnaPonuda;
          }
      }

      res.status(201).json(novaPonuda);
  } catch (error) {
      console.error('Greška prilikom kreiranja ponude:', error);
      res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.post('/nekretnina/:id/zahtjev', async (req, res) => {
  const username = req.session?.username; 
  if (!username) {
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  const { tekst, trazeniDatum } = req.body;
  const nekretninaId = req.params.id;

  try {
      
      const trenutniDatum = new Date();
      const trazeniDatumObj = new Date(trazeniDatum);

      if (trazeniDatumObj < trenutniDatum) {
          return res.status(404).json({ greska: 'Datum pregleda ne može biti u prošlosti.' });
      }

     
      const korisnik = await db.korisnik.findOne({
          where: { username },
          attributes: ['id'],
      });

      if (!korisnik) {
          return res.status(404).json({ greska: 'Korisnik nije pronađen.' });
      }

     
      const nekretnina = await db.nekretnina.findByPk(nekretninaId);
      if (!nekretnina) {
          return res.status(404).json({ greska: 'Nekretnina nije pronađena.' });
      }

      
      const noviZahtjev = await db.zahtjev.create({
          tekst,
          trazeniDatum: trazeniDatumObj,
          korisnikId: korisnik.id, 
          nekretninaId,
      });

      res.status(201).json(noviZahtjev);
  } catch (error) {
      console.error('Greška prilikom kreiranja zahtjeva:', error);
      res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.put('/nekretnina/:id/zahtjev/:zid', async (req, res) => {
  const username = req.session?.username; 
  const { odobren, addToTekst } = req.body; 
  const nekretninaId = req.params.id;
  const zahtjevId = req.params.zid;

  try {
      
      if (!username) {
          return res.status(401).json({ greska: 'Neautorizovan pristup.' });
      }

      
      const korisnik = await db.korisnik.findOne({
          where: { username },
      });

      if (!korisnik || !korisnik.admin) {
          return res.status(403).json({ greska: 'Samo administrator može odgovarati na zahteve.' });
      }

     
      const zahtjev = await db.zahtjev.findOne({
          where: {
              id: zahtjevId,
              nekretninaId: nekretninaId,
          },
      });

      if (!zahtjev) {
          return res.status(404).json({ greska: 'Zahtev nije pronađen.' });
      }

      
      if (odobren === undefined) {
          return res.status(400).json({ greska: 'Parametar "odobren" je obavezan.' });
      }

      if (!odobren && (!addToTekst || addToTekst.trim() === '')) {
          return res
              .status(400)
              .json({ greska: 'Parametar "addToTekst" je obavezan kada je "odobren" postavljen na false.' });
      }

     
      zahtjev.odobreno = odobren;
      if (addToTekst) {
          zahtjev.tekst += ` ODGOVOR ADMINA: ${addToTekst}`;
      }

      await zahtjev.save();

      res.status(200).json({
          poruka: 'Zahtev je uspešno ažuriran.',
          zahtjev,
      });
  } catch (error) {
      console.error('Greška prilikom ažuriranja zahteva:', error);
      res.status(500).json({ greska: 'Internal Server Error' });
  }
});


/* ----------------- MARKETING ROUTES ----------------- */

// Route that increments value of pretrage for one based on list of ids in nizNekretnina
app.post('/marketing/nekretnine', async (req, res) => {
  const { nizNekretnina } = req.body;

  try {
    // Load JSON data
    let preferencije = await readJsonFile('preferencije');

    // Check format
    if (!preferencije || !Array.isArray(preferencije)) {
      console.error('Neispravan format podataka u preferencije.json.');
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    // Init object for search
    preferencije = preferencije.map((nekretnina) => {
      nekretnina.pretrage = nekretnina.pretrage || 0;
      return nekretnina;
    });

    // Update atribute pretraga
    nizNekretnina.forEach((id) => {
      const nekretnina = preferencije.find((item) => item.id === id);
      if (nekretnina) {
        nekretnina.pretrage += 1;
      }
    });

    // Save JSON file
    await saveJsonFile('preferencije', preferencije);

    res.status(200).json({});
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/marketing/nekretnina/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Read JSON
    const preferencije = await readJsonFile('preferencije');

    // Finding the needed objects based on id
    const nekretninaData = preferencije.find((item) => item.id === parseInt(id, 10));

    if (nekretninaData) {
      // Update clicks
      nekretninaData.klikovi = (nekretninaData.klikovi || 0) + 1;

      // Save JSON file
      await saveJsonFile('preferencije', preferencije);

      res.status(200).json({ success: true, message: 'Broj klikova ažuriran.' });
    } else {
      res.status(404).json({ error: 'Nekretnina nije pronađena.' });
    }
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/marketing/osvjezi/pretrage', async (req, res) => {
  const { nizNekretnina } = req.body || { nizNekretnina: [] };

  try {
    // Read JSON
    const preferencije = await readJsonFile('preferencije');

    // Finding the needed objects based on id
    const promjene = nizNekretnina.map((id) => {
      const nekretninaData = preferencije.find((item) => item.id === id);
      return { id, pretrage: nekretninaData ? nekretninaData.pretrage : 0 };
    });

    res.status(200).json({ nizNekretnina: promjene });
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/marketing/osvjezi/klikovi', async (req, res) => {
  const { nizNekretnina } = req.body || { nizNekretnina: [] };

  try {
    // Read JSON
    const preferencije = await readJsonFile('preferencije');

    // Finding the needed objects based on id
    const promjene = nizNekretnina.map((id) => {
      const nekretninaData = preferencije.find((item) => item.id === id);
      return { id, klikovi: nekretninaData ? nekretninaData.klikovi : 0 };
    });

    res.status(200).json({ nizNekretnina: promjene });
  } catch (error) {
    console.error('Greška prilikom čitanja ili pisanja JSON datoteke:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

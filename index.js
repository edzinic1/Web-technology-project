const express = require('express');
const session = require("express-session");
const path = require('path');
const fs = require('fs').promises; // Using asynchronus API for file read and write
const bcrypt = require('bcrypt');


const app = express();
const PORT = 3000;

app.use(session({
  secret: 'tajna sifra',
  resave: true,
  saveUninitialized: true
}));



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

      if (korisnikPodaci.brojPokusaja >= LOGIN_LIMIT && trenutniTrenutak - korisnikPodaci.zadnjiPokusaj < BLOCK_TIME) {
        await logPrijava(username, 'neuspješno');
        return res.status(429).json({ greska: 'Previse neuspjesnih pokusaja. Pokusajte ponovo za 1 minutu.' });
      }
    }

    const data = await fs.readFile(path.join(__dirname, 'data', 'korisnici.json'), 'utf-8');
    const korisnici = JSON.parse(data);
    const korisnik = korisnici.find(k => k.username === username);

    if (!korisnik) {

      await logPrijava(username, 'neuspješno');

      if (!loginAttempts.has(username)) {
        loginAttempts.set(username, { brojPokusaja: 1, zadnjiPokusaj: trenutniTrenutak });
      } else {
        const korisnikPodaci = loginAttempts.get(username);
        korisnikPodaci.brojPokusaja++;
        korisnikPodaci.zadnjiPokusaj = trenutniTrenutak;
      }

      return res.json({ poruka: 'Neuspješna prijava' });
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

      return res.json({ poruka: 'Neuspješna prijava' });
    }

    loginAttempts.delete(username);

    await logPrijava(username, 'uspješno');

    req.session.username = korisnik.username;
    res.json({ poruka: 'Uspješna prijava' });
  } catch (error) {
    console.error('Greška tokom prijave:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});


/*
Delete everything from the session.
*/
app.post('/logout', (req, res) => {
  // Check if the user is authenticated
  if (!req.session.username) {
    // User is not logged in
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  // Clear all information from the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      res.status(500).json({ greska: 'Internal Server Error' });
    } else {
      res.status(200).json({ poruka: 'Uspješno ste se odjavili' });
    }
  });
});

/*
Returns currently logged user data. First takes the username from the session and grabs other data
from the .json file.
*/
app.get('/korisnik', async (req, res) => {
  // Check if the username is present in the session
  if (!req.session.username) {
    // User is not logged in
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  // User is logged in, fetch additional user data
  const username = req.session.username;

  try {
    // Read user data from the JSON file
    const users = await readJsonFile('korisnici');

    // Find the user by username
    const user = users.find((u) => u.username === username);

    if (!user) {
      // User not found (should not happen if users are correctly managed)
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
    }

    // Send user data
    const userData = {
      id: user.id,
      ime: user.ime,
      prezime: user.prezime,
      username: user.username,
      password: user.password // Should exclude the password for security reasons
    };

    res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

/*
Allows logged user to make a request for a property
*/

app.get('/upiti/moji', async (req, res) => {

  if (!req.session.username) {
    console.log('Korisnik nije ulogovan!');
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  const username = req.session.username;
  console.log(`Korisnik ulogovan: ${username}`);

  try {
    const korisnici = await readJsonFile('korisnici');
    const nekretnine = await readJsonFile('nekretnine');

    const korisnik = korisnici.find(k => k.username === username);

    if (!korisnik) {
      console.log(`Korisnik sa username "${username}" nije pronađen!`);
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
    }

    console.log(`Korisnik pronađen: ${korisnik.id}`);

    let korisnikovUpiti = [];

    nekretnine.forEach(nekretnina => {
      const upitiZaNekretninu = nekretnina.upiti.filter(upit => upit.korisnik_id === korisnik.id);
      korisnikovUpiti = [...korisnikovUpiti, ...upitiZaNekretninu];
    });

    console.log(`Broj upita korisnika: ${korisnikovUpiti.length}`);

    if (korisnikovUpiti.length === 0) {
      return res.status(404).json([]);
    }

    const odgovor = korisnikovUpiti.map(upit => ({
      id_nekretnine: nekretnine.find(n => n.upiti.includes(upit)).id,
      tekst_upita: upit.tekst_upita
    }));

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
    const users = await readJsonFile('korisnici');
    const nekretnine = await readJsonFile('nekretnine');

    const loggedInUser = users.find((user) => user.username === req.session.username);

    if (!loggedInUser) {
      return res.status(400).json({ greska: 'Korisnik ne postoji' });
    }

    const nekretnina = nekretnine.find((property) => property.id === nekretnina_id);

    if (!nekretnina) {
      return res.status(400).json({ greska: `Nekretnina sa id-em ${nekretnina_id} ne postoji` });
    }


    const brojUpitaZaNekretninu = nekretnina.upiti.filter(
      (upit) => upit.korisnik_id === loggedInUser.id
    ).length;

    if (brojUpitaZaNekretninu >= 3) {
      return res.status(429).json({ greska: 'Previse upita za istu nekretninu.' });
    }


    nekretnina.upiti.push({
      korisnik_id: loggedInUser.id,
      tekst_upita: tekst_upita,
    });


    await saveJsonFile('nekretnine', nekretnine);

    res.status(200).json({ poruka: 'Upit je uspješno dodan' });
  } catch (error) {
    console.error('Greška prilikom obrade upita:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

/*
Updates any user field
*/
app.put('/korisnik', async (req, res) => {
  // Check if the user is authenticated
  if (!req.session.username) {
    // User is not logged in
    return res.status(401).json({ greska: 'Neautorizovan pristup' });
  }

  // Get data from the request body
  const { ime, prezime, username, password } = req.body;

  try {
    // Read user data from the JSON file
    const users = await readJsonFile('korisnici');

    // Find the user by username
    const loggedInUser = users.find((user) => user.username === req.session.username);

    if (!loggedInUser) {
      // User not found (should not happen if users are correctly managed)
      return res.status(401).json({ greska: 'Neautorizovan pristup' });
    }

    // Update user data with the provided values
    if (ime) loggedInUser.ime = ime;
    if (prezime) loggedInUser.prezime = prezime;
    if (username) loggedInUser.username = username;
    if (password) {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      loggedInUser.password = hashedPassword;
    }

    // Save the updated user data back to the JSON file
    await saveJsonFile('korisnici', users);
    res.status(200).json({ poruka: 'Podaci su uspješno ažurirani' });
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

/*
Returns all properties from the file.
*/
app.get('/nekretnina/:id', async (req, res) => {
  const nekretninaId = req.params.id;

  try {

    const nekretnine = await readJsonFile('nekretnine');

    const nekretnina = nekretnine.find(n => n.id === parseInt(nekretninaId));

    if (!nekretnina) {
      return res.status(404).json({ greska: `Nekretnina sa id-om ${nekretninaId} nije pronađena.` });
    }

    const poslednjaTriUpita = nekretnina.upiti.slice(-3);

    const detaljiNekretnine = {
      id: nekretnina.id,
      naziv: nekretnina.naziv,
      lokacija: nekretnina.lokacija,
      cijena: nekretnina.cijena,
      upiti: poslednjaTriUpita
    };

    res.status(200).json(detaljiNekretnine);
  } catch (error) {
    console.error('Greška prilikom dohvaćanja detalja nekretnine:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.get('/nekretnine/top5', async (req, res) => {
  const { lokacija } = req.query;

  if (!lokacija) {
    return res.status(400).json({ greska: 'Lokacija nije navedena.' });
  }

  try {

    const nekretnine = await readJsonFile('nekretnine');

    const filtriraneNekretnine = nekretnine
      .filter(nekretnina => nekretnina.lokacija.toLowerCase() === lokacija.toLowerCase())
      .sort((a, b) => {
        const datumA = new Date(a.datum_objave.split('.').reverse().join('-'));
        const datumB = new Date(b.datum_objave.split('.').reverse().join('-'));
        return datumB - datumA;
      })
      .slice(0, 5);

    if (filtriraneNekretnine.length === 0) {
      return res.status(404).json({ poruka: 'Nema nekretnina za zadanu lokaciju.' });
    }

    res.status(200).json(filtriraneNekretnine);
  } catch (error) {
    console.error('Greška prilikom obrade zahtjeva za top 5 nekretnina:', error);
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
    const nekretnine = await readJsonFile('nekretnine');
    const nekretnina = nekretnine.find(n => n.id === parseInt(nekretninaId));
    if (!nekretnina) {
      return res.status(404).json({ greska: `Nekretnina sa id-om ${nekretninaId} nije pronađena.` });
    }
    const upiti = nekretnina.upiti || [];
    const upitiPerPage = 3;
    const startIndex = (page - 1) * upitiPerPage;
    const endIndex = page * upitiPerPage;
    const upitiNaStranici = upiti.slice().reverse().slice(startIndex, endIndex);

    res.status(200).json(upitiNaStranici);
  } catch (error) {
    console.error('Greška prilikom obrade zahtjeva:', error);
    res.status(500).json({ greska: 'Internal Server Error' });
  }
});

app.get('/nekretnine', async (req, res) => {
  try {
    const nekretnineData = await readJsonFile('nekretnine');
    res.json(nekretnineData);
  } catch (error) {
    console.error('Error fetching properties data:', error);
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

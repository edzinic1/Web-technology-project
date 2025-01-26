document.addEventListener('DOMContentLoaded', onDOMContentLoaded);

function onDOMContentLoaded() {
    let trenutnaStranica = 1;
    const prikaziBrojUpita = 3;
    let isLoading = false;
    let allUpitiLoaded = false;
    let allUpiti = [];

    const upitiContainer = document.getElementById("upiti");
    const prevBtn = document.querySelector('.carousel-button.prev');
    const nextBtn = document.querySelector('.carousel-button.next');

     // Ekstrahujemo ID nekretnine iz URL-a
     const params = new URLSearchParams(window.location.search);
     const X = params.get('id'); // ID nekretnine iz URL-a
 

    function prikaziUpite(upiti) {
        upitiContainer.innerHTML = upiti.map(upit =>
            `<div class="upit"><p>${upit.tekst_upita}</p></div>`
        ).join('');
    }

    function ucitajUpite(stranica, nekretnina_id) {
        if (isLoading || allUpitiLoaded) return;
        isLoading = true;

        PoziviAjax.getNextUpiti(X, stranica, (error, noviUpiti) => {
            if (error) {
                console.error("Greška pri učitavanju novih upita:", error);
            } else {
                if (noviUpiti.length > 0) {
                    allUpiti = allUpiti.concat(noviUpiti);
                    prikaziUpite(noviUpiti);
                    trenutnaStranica = stranica;
                    if (noviUpiti.length < prikaziBrojUpita) {
                        allUpitiLoaded = true;
                    }
                } else {
                    allUpitiLoaded = true;
                }
            }
            isLoading = false;
        });
    }

    nextBtn.addEventListener('click', function () {
        if (allUpitiLoaded) {
            if ((trenutnaStranica * prikaziBrojUpita) < allUpiti.length) {
                trenutnaStranica++;
                prikaziUpite(allUpiti.slice((trenutnaStranica - 1) * prikaziBrojUpita, trenutnaStranica * prikaziBrojUpita));
            }
        } else {
            if ((trenutnaStranica * prikaziBrojUpita) < allUpiti.length) {
                trenutnaStranica++;
                prikaziUpite(allUpiti.slice((trenutnaStranica - 1) * prikaziBrojUpita, trenutnaStranica * prikaziBrojUpita));
            } else {
                ucitajUpite(trenutnaStranica + 1);
            }
        }
    });

    prevBtn.addEventListener('click', function () {
        if (trenutnaStranica > 1) {
            trenutnaStranica--;
            prikaziUpite(allUpiti.slice((trenutnaStranica - 1) * prikaziBrojUpita, trenutnaStranica * prikaziBrojUpita));
        }
    });

    ucitajUpite(trenutnaStranica);

    const lokacijaLink = document.getElementById('lokacija');
    const top5Container = document.getElementById('top5-nekretnine');

    lokacijaLink.addEventListener('click', function (event) {
        event.preventDefault();
        const lokacija = lokacijaLink.textContent.trim();

        PoziviAjax.getTop5Nekretnina(lokacija, (error, nekretnine) => {
            if (error) {
                top5Container.innerHTML = `<p>Greška: ${error.statusText}</p>`;
            } else {
                if (nekretnine.length === 0) {
                    top5Container.innerHTML = "<p>Nema dostupnih nekretnina za prikaz.</p>";
                } else {
                    const list = document.createElement('ul');
                    nekretnine.forEach((nekretnina) => {
                        const item = document.createElement('li');
                        item.textContent = `${nekretnina.naziv} - ${nekretnina.cijena} KM`;
                        list.appendChild(item);
                    });
                    top5Container.innerHTML = '';
                    top5Container.appendChild(list);
                }
            }
        });
    });
}
document.addEventListener("DOMContentLoaded", onDOMContentLoaded);

function onDOMContentLoaded() {
    const urlParams = new URLSearchParams(window.location.search);
    const nekretninaId = urlParams.get("id");

    if (!nekretninaId) {
        console.error("ID nekretnine nije pronađen u URL-u!");
        return;
    }

    const interesovanjaContainer = document.getElementById("table-container");
    const upitContainer = document.getElementById("upit-container");

    let logovanKorisnik = null;

    
    PoziviAjax.getKorisnik((error, korisnik) => {
        if (error) {
            console.error("Greška pri učitavanju korisnika:", error);
            return;
        }

        logovanKorisnik = korisnik;
        console.log("Trenutni korisnik:", logovanKorisnik);

        
        ucitajInteresovanja(nekretninaId, logovanKorisnik);
    });

    
    function ucitajInteresovanja(nekretninaId, korisnik) {
        PoziviAjax.getInteresovanja(nekretninaId, (error, interesovanja) => {
            if (error) {
                console.error("Greška pri učitavanju interesovanja:", error);
                interesovanjaContainer.innerHTML = `<p>Greška prilikom učitavanja podataka.</p>`;
                return;
            }

           
            if (interesovanja.ponude) {
                interesovanjaContainer.innerHTML += generatePonudeHTML(interesovanja.ponude, korisnik);
            }

            
            if (interesovanja.zahtjevi) {
                interesovanjaContainer.innerHTML += generateZahtjeviHTML(interesovanja.zahtjevi, korisnik);
            }

            
            if (interesovanja.upiti) {
                interesovanjaContainer.innerHTML += generateUpitiHTML(interesovanja.upiti);
            }
        });
    }

    
    function generatePonudeHTML(ponude, korisnik) {
        let html = "<h3>Ponude</h3><table><thead><tr><th>ID</th><th>Tekst ponude</th><th>Status</th></tr></thead><tbody>";
        ponude.forEach(ponuda => {
            if (korisnik.admin || ponuda.korisnikId === korisnik.id) {
                html += `
                    <tr>
                        <td>${ponuda.id}</td>
                        <td>${ponuda.tekst}</td>
                        <td>${ponuda.odbijenaPonuda ? 'Odbijena' : 'Odobrena' }</td>
                    </tr>
                `;
            }
        });
        html += "</tbody></table>";
        return html;
    }

    
    function generateZahtjeviHTML(zahtjevi, korisnik) {
        let html = "<h3>Zahtjevi</h3><table><thead><tr><th>ID</th><th>Tekst zahtjeva</th><th>Datum</th><th>Status</th></tr></thead><tbody>";
        zahtjevi.forEach(zahtjev => {
            if (korisnik.admin || zahtjev.korisnikId === korisnik.id || zahtjev.vezaniZaKorisnikaId === korisnik.id) {
                html += `
                    <tr data-id="${zahtjev.id}" class="interesovanje-row">
                        <td>${zahtjev.id}</td>
                        <td>${zahtjev.tekst}</td>
                        <td>${zahtjev.trazeniDatum}</td>
                        <td>${zahtjev.odobreno ? 'Odobren' : 'Odbijen'}</td>
                    </tr>
                `;
            }
        });
        html += "</tbody></table>";
        return html;
    }

    
    function generateUpitiHTML(upiti) {
        let html = "<h3>Upiti</h3><table><thead><tr><th>ID</th><th>Tekst upita</th></tr></thead><tbody>";
        upiti.forEach(upit => {
            html += `
                <tr data-id="${upit.id}" class="interesovanje-row">
                    <td>${upit.id}</td>
                    <td>${upit.tekst}</td>
                </tr>
            `;
        });
        html += "</tbody></table>";
        return html;
    }

    
    document.addEventListener("click", function (event) {
        if (event.target.closest(".interesovanje-row")) {
            const selectedRow = event.target.closest(".interesovanje-row");
            const id = selectedRow.getAttribute("data-id");

            
            upitContainer.style.display = "block";

            
            const submitUpitButton = document.getElementById("submit-upit");
            submitUpitButton.onclick = function () {
                const upitText = document.getElementById("upit-text").value;
                if (upitText.trim()) {
                    console.log(`Poslat upit za ID ${id}: ${upitText}`);
                    
                    PoziviAjax.posaljiteUpit(id, upitText, (error, response) => {
                        if (error) {
                            console.error("Greška pri slanju upita:", error);
                        } else {
                            console.log("Upit je uspešno poslat!", response);
                        }
                    });
                }
            };
        }
    });
}

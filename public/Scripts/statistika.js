document.addEventListener('DOMContentLoaded', function() {

    const listaNekretnina = [{
        id: 1,
        tip_nekretnine: "Stan",
        naziv: "Useljiv stan Sarajevo",
        kvadratura: 58,
        cijena: 232000,
        tip_grijanja: "plin",
        lokacija: "Novo Sarajevo",
        godina_izgradnje: 2019,
        datum_objave: "01.10.2023.",
        opis: "Sociis natoque penatibus.",
        upiti: [{
            korisnik_id: 1,
            tekst_upita: "Nullam eu pede mollis pretium."
        },
        {
            korisnik_id: 2,
            tekst_upita: "Phasellus viverra nulla."
        }]
    },{
        id: 1,
        tip_nekretnine: "Stan",
        naziv: "Useljiv stan Sarajevo",
        kvadratura: 58,
        cijena: 32000,
        tip_grijanja: "plin",
        lokacija: "Novo Sarajevo",
        godina_izgradnje: 2019,
        datum_objave: "01.10.2009.",
        opis: "Sociis natoque penatibus.",
        upiti: [{
            korisnik_id: 1,
            tekst_upita: "Nullam eu pede mollis pretium."
        },
        {
            korisnik_id: 2,
            tekst_upita: "Phasellus viverra nulla."
        }]
    },{
        id: 1,
        tip_nekretnine: "Stan",
        naziv: "Useljiv stan Sarajevo",
        kvadratura: 58,
        cijena: 232000,
        tip_grijanja: "plin",
        lokacija: "Novo Sarajevo",
        godina_izgradnje: 2019,
        datum_objave: "01.10.2003.",
        opis: "Sociis natoque penatibus.",
        upiti: [{
            korisnik_id: 1,
            tekst_upita: "Nullam eu pede mollis pretium."
        },
        {
            korisnik_id: 2,
            tekst_upita: "Phasellus viverra nulla."
        }]
    },
    {
        id: 2,
        tip_nekretnine: "Kuća",
        naziv: "Mali poslovni prostor",
        kvadratura: 20,
        cijena: 70000,
        tip_grijanja: "struja",
        lokacija: "Centar",
        godina_izgradnje: 2005,
        datum_objave: "20.08.2023.",
        opis: "Magnis dis parturient montes.",
        upiti: [{
            korisnik_id: 2,
            tekst_upita: "Integer tincidunt."
        }
        ]
    },
    {
        id: 3,
        tip_nekretnine: "Kuća",
        naziv: "Mali poslovni prostor",
        kvadratura: 20,
        cijena: 70000,
        tip_grijanja: "struja",
        lokacija: "Centar",
        godina_izgradnje: 2005,
        datum_objave: "20.08.2023.",
        opis: "Magnis dis parturient montes.",
        upiti: [{
            korisnik_id: 2,
            tekst_upita: "Integer tincidunt."
        }
        ]
    },
    {
        id: 4,
        tip_nekretnine: "Kuća",
        naziv: "Mali poslovni prostor",
        kvadratura: 20,
        cijena: 70000,
        tip_grijanja: "struja",
        lokacija: "Centar",
        godina_izgradnje: 2005,
        datum_objave: "20.08.2023.",
        opis: "Magnis dis parturient montes.",
        upiti: [{
            korisnik_id: 2,
            tekst_upita: "Integer tincidunt."
        }
        ]
    }]
    
    const listaKorisnika = [{
        id: 1,
        ime: "Neko",
        prezime: "Nekic",
        username: "username1",
    },
    {
        id: 2,
        ime: "Neko2",
        prezime: "Nekic2",
        username: "username2",
    }]
    
    const addPeriodButton = document.getElementById('add-period');
    const addPriceRangeButton = document.getElementById('add-price-range');
    const drawHistogramButton = document.getElementById('draw-histogram');
    const searchButton = document.getElementById('search-button');
    const korisnikInput = document.getElementById('korisnik-input');
    const mojeNekretnineDiv = document.getElementById('moje-nekretnine');
 
    
    function getKorisnikByUsername(username) {
        return listaKorisnika.find(k => k.username === username);
    }

    searchButton.addEventListener('click', function() {
        const korisnikUsername = korisnikInput.value.trim();
        if (korisnikUsername === "") {
            alert("Molimo unesite korisničko ime.");
            return;
        }
    
        const korisnik = getKorisnikByUsername(korisnikUsername);
        if (!korisnik) {
            alert(`Korisnik s korisničkim imenom "${korisnikUsername}" nije pronađen.`);
            return;
        }
    
        
        const statistikaNekretnina = StatistikaNekretnina.getInstance(listaNekretnina, listaKorisnika);
        
        
        const mojeNekretnineKorisnika = statistikaNekretnina.mojeNekretnine(korisnik);
        
       
        if (mojeNekretnineKorisnika.length === 0) {
            mojeNekretnineDiv.innerHTML = `<p>Korisnik "${korisnikUsername}" nema nekretnine.</p>`;
        } else {
            mojeNekretnineDiv.innerHTML = "<h2>Moje nekretnine:</h2>";
            mojeNekretnineKorisnika.forEach(nekretnina => {
                const nekretninaElement = document.createElement('div');
                nekretninaElement.classList.add('nekretnina');
                nekretninaElement.innerHTML = `
                    <p>Tip: ${nekretnina.tip_nekretnine}</p>
                    <p>Cijena: ${nekretnina.cijena}</p>
                    <p>Godina: ${nekretnina.godina_izgradnje}</p>
                    <p>Kvadratura: ${nekretnina.kvadratura} m²</p>
                    <p>Lokacija: ${nekretnina.lokacija}</p>
                    <p>Opis: ${nekretnina.opis}</p>
                    ${nekretnina.upiti.length > 0 ? nekretnina.upiti.filter(upit => upit.korisnik_id === korisnik.id).map((upit, index) => `
                        <div class="upit">
                            <p>Upit od korisnika: ${upit.tekst_upita}</p>
                        </div>
                    `).join('') : `<p>Nemate upite za ovu nekretninu.</p>`}
                `;
                mojeNekretnineDiv.appendChild(nekretninaElement);
            });
        }
    });

    let periods = [];
    let priceRanges = [];

    addPeriodButton.addEventListener('click', function() {
        const periodContainer = document.getElementById('period-container');
        const newPeriodGroup = document.createElement('div');
        newPeriodGroup.classList.add('period-group');

        newPeriodGroup.innerHTML = `
            <label for="start-year">Period: Od godine</label>
            <input type="text" name="start-year" placeholder="Početna godina">
            <label for="end-year">Do godine</label>
            <input type="text" name="end-year" placeholder="Krajnja godina">
        `;

        periodContainer.appendChild(newPeriodGroup);
    });


    addPriceRangeButton.addEventListener('click', function() {
        const priceRangeContainer = document.getElementById('price-range-container');
        const newPriceRangeGroup = document.createElement('div');
        newPriceRangeGroup.classList.add('price-range-group');

        newPriceRangeGroup.innerHTML = `
            <label for="min-price">Raspon cijena: Od</label>
            <input type="text" name="min-price" placeholder="Minimalna cijena">
            <label for="max-price">Do</label>
            <input type="text" name="max-price" placeholder="Maksimalna cijena">
        `;

        priceRangeContainer.appendChild(newPriceRangeGroup);
    });


    drawHistogramButton.addEventListener('click', function() {
        
        const periodInputs = document.querySelectorAll('#period-container input');
        periods = [];
        for (let i = 0; i < periodInputs.length; i += 2) {
            const startYear = parseInt(periodInputs[i].value);
            const endYear = parseInt(periodInputs[i + 1].value);
            if (!isNaN(startYear) && !isNaN(endYear) && startYear <= endYear) {
                periods.push({ od: startYear, do: endYear });
            }
        }
    
       
        const priceInputs = document.querySelectorAll('#price-range-container input');
        priceRanges = [];
        for (let i = 0; i < priceInputs.length; i += 2) {
            const minPrice = parseInt(priceInputs[i].value);
            const maxPrice = parseInt(priceInputs[i + 1].value);
            if (!isNaN(minPrice) && !isNaN(maxPrice) && minPrice <= maxPrice) {
                priceRanges.push({ od: minPrice, do: maxPrice });
            }
        }
    
        if (periods.length === 0 || priceRanges.length === 0) {
            alert("Molimo unesite ispravne periode i raspon cijena.");
            return;
        }
    
        
        const statistikaNekretnina = StatistikaNekretnina.getInstance(listaNekretnina, []);
        const histogramData = statistikaNekretnina.histogramCijena(periods, priceRanges);
    
     
        if (!histogramData || histogramData.length === 0) {
            alert("Nema podataka za odabrane periode i raspone cijena.");
            return;
        }
    
        const labels = priceRanges.map(raspon => `${raspon.od} - ${raspon.do}`);
    
        
        const datasets = periods.map((period, periodIndex) => {
            const data = labels.map(label => {
                const rasponIndex = priceRanges.findIndex(
                    raspon => label === `${raspon.od} - ${raspon.do}`
                );
                const histogramEntry = histogramData.find(
                    entry =>
                        entry.indeksPerioda === periodIndex &&
                        entry.indeksRasporedaCijena === rasponIndex
                );
                return histogramEntry ? histogramEntry.brojNekretnina : 0;
            });
    
            return {
                label: `${period.od} - ${period.do}`,
                data: data,
                backgroundColor: `rgba(${50 + periodIndex * 40}, ${100 + periodIndex * 20}, 200, 0.6)`,
                borderColor: `rgba(${50 + periodIndex * 40}, ${100 + periodIndex * 20}, 200, 1)`,
                borderWidth: 1
            };
        });
    
        const ctx = document.getElementById('price-histogram').getContext('2d');
        if (window.histogramChart) {
            window.histogramChart.destroy();
        }
        window.histogramChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Raspon cijena'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Broj nekretnina'
                        }
                    }
                }
            }
        });
    });
    document.getElementById('outlierButton').addEventListener('click', function() {
        
        const kriterij = document.getElementById('kriterij').value;
        const vrijednost = document.getElementById('vrijednost').value.trim();
        const svojstvo = document.getElementById('svojstvo').value;
        
       
        if (!vrijednost) {
            alert("Molimo unesite vrijednost.");
            return;
        }
    
        let kriterijZaSlanje = kriterij;
    
       
        if (kriterij === "tip_nekretnine") {
            const validTypes = ["stan", "kuca", "poslovni prostor"];
            
            
            if (!validTypes.includes(vrijednost.toLowerCase())) {
                alert("Molimo unesite jedan od sljedećih tipova nekretnine: stan, kuca, poslovni prostor.");
                return;
            }
            
            
            kriterijZaSlanje = `tip_nekretnine:"${vrijednost}"`;
        } else {
            
            kriterijZaSlanje = `${kriterij}:${vrijednost}`;
        }
    
        
        const outlier = kriterijZaSlanje;
        
        
        const statistika = StatistikaNekretnina.getInstance(listaNekretnina, listaKorisnika);
        const outlierNekretnina = statistika.outlier(outlier, svojstvo);
        
        
        const outlierResultsDiv = document.getElementById('outlierResults');
        if (outlierNekretnina) {
            outlierResultsDiv.innerHTML = `
                <h3>Outlier Nekretnina:</h3>
                <ul>
                    <li><strong>ID:</strong> ${outlierNekretnina.id}</li>
                    <li><strong>Tip nekretnine:</strong> ${outlierNekretnina.tip_nekretnine}</li>
                    <li><strong>Kvadratura:</strong> ${outlierNekretnina.kvadratura} m²</li>
                    <li><strong>Cijena:</strong> ${outlierNekretnina.cijena} KM</li>
                    <li><strong>Godina izgradnje:</strong> ${outlierNekretnina.godina_izgradnje}</li>
                </ul>
            `;
        } else {
            outlierResultsDiv.innerHTML = "<p>Nema outlier-a za odabrani kriterij i svojstvo.</p>";
        }
    });
           
    document.addEventListener('DOMContentLoaded', function() {
        const calculateAverageAreaButton = document.getElementById('calculate-average-area');
        const averageAreaResultDiv = document.getElementById('average-area-result');
        
        calculateAverageAreaButton.addEventListener('click', function() {
            
            const kriterij = document.getElementById('kriterij').value;
            let vrijednost = document.getElementById('vrijednost1').value.trim();
    
            console.log("Kriterij: ", kriterij);  
            console.log("Vrijednost: ", vrijednost);      
            if (!kriterij) {
                alert("Molimo odaberite kriterij.");
                return;
            }
    
            if (['min_kvadratura', 'max_kvadratura', 'min_cijena', 'max_cijena'].includes(kriterij) && !vrijednost) {
                alert("Molimo unesite vrijednost za odabrani kriterij.");
                return;
            }
    
            
            if (vrijednost && isNaN(vrijednost)) {
                alert("Unesena vrijednost mora biti broj.");
                return;
            }
    
            let kriterijZaSlanje = kriterij;
            if (vrijednost) {
                kriterijZaSlanje = `${kriterij}:${vrijednost}`;
            }
    
            console.log("Kriterij za slanje:", kriterijZaSlanje);  
    

            const statistikaNekretnina = StatistikaNekretnina.getInstance(listaNekretnina, listaKorisnika);
            if (!statistikaNekretnina) {
                console.error("StatistikaNekretnina instanca nije pronađena!");
                return;
            }
    

            let prosjecnaKvadratura = statistikaNekretnina.prosjecnaKvadratura(kriterijZaSlanje);
            console.log("Rezultat prosjecne kvadrature:", prosjecnaKvadratura);  
    
            
            if (prosjecnaKvadratura === 0) {
                averageAreaResultDiv.innerHTML = "<p>Nema nekretnina za odabrani kriterij.</p>";
            } else if (prosjecnaKvadratura) {
                averageAreaResultDiv.innerHTML = `<p>Prosječna kvadratura: ${prosjecnaKvadratura} m²</p>`;
            } else {
                averageAreaResultDiv.innerHTML = "<p>Došlo je do greške u izračunu.</p>";
            }
        });
    });
        
            
});

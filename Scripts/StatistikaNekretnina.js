const StatistikaNekretnina = (function () {
    let instance;

    function createInstance() {
        let spisakNekretnina = new SpisakNekretnina();

        let init = function (listaNekretnina, listaKorisnika) {
            spisakNekretnina.init(listaNekretnina, listaKorisnika);
        };

        let prosjecnaKvadratura = function (kriterij) {
            let filtriraneNekretnine = spisakNekretnina.filtrirajNekretnine(kriterij);
            if (filtriraneNekretnine.length === 0) return 0;

            let ukupnaKvadratura = filtriraneNekretnine.reduce((acc, nekretnina) => {
                if (nekretnina.kvadratura && nekretnina.kvadratura > 0) {
                    return acc + nekretnina.kvadratura;
                }
                return acc;
            }, 0);

            return ukupnaKvadratura / filtriraneNekretnine.length;
        };

        let outlier = function (kriterij, nazivSvojstva) {
            let filtriraneNekretnine = spisakNekretnina.filtrirajNekretnine(kriterij);

            if (filtriraneNekretnine.length === 0) return null;

            let suma = 0;
            let brojNekretnina = 0;

            filtriraneNekretnine.forEach(nekretnina => {
                if (typeof nekretnina[nazivSvojstva] === 'number') {
                    suma += nekretnina[nazivSvojstva];
                    brojNekretnina++;
                }
            });

            if (brojNekretnina === 0) return null;

            let srednjaVrijednost = suma / brojNekretnina;

            let maxOdstupanje = -Infinity;
            let outlierNekretnina = null;

            filtriraneNekretnine.forEach(nekretnina => {
                if (typeof nekretnina[nazivSvojstva] === 'number') {
                    let odstupanje = Math.abs(nekretnina[nazivSvojstva] - srednjaVrijednost);
                    if (odstupanje > maxOdstupanje) {
                        maxOdstupanje = odstupanje;
                        outlierNekretnina = nekretnina;
                    }
                }
            });

            return outlierNekretnina;
        };

        let mojeNekretnine = function (korisnik) {
            const nekretnineKorisnika = spisakNekretnina.listaNekretnina.filter(nekretnina => {
                return nekretnina.upiti.some(upit => upit.korisnik_id === korisnik.id);
            });
            
            return nekretnineKorisnika;
        };

        let histogramCijena = function (periodi, rasponiCijena) {
            let histogram = [];
            console.log('RadiHistogram')
            if (periodi.length === 0 || rasponiCijena.length === 0) {
                return [];
            }


               periodi.forEach((period, indeksPerioda) => {
        let nekretnineUPeriodu = spisakNekretnina.listaNekretnina.filter(nekretnina => {
            const godinaObjave = parseInt(nekretnina.datum_objave.split('.')[2]);  
            return godinaObjave >= period.od && godinaObjave <= period.do;
        });


                rasponiCijena.forEach((raspon, indeksRasporedaCijena) => {
                    let brojNekretnina = nekretnineUPeriodu.filter(nekretnina => {
                        return nekretnina.cijena >= raspon.od && nekretnina.cijena <= raspon.do;
                    }).length;

                    histogram.push({
                        indeksPerioda: indeksPerioda,
                        indeksRasporedaCijena: indeksRasporedaCijena,
                        brojNekretnina: brojNekretnina
                    });
                });
            });

            return histogram;
        };

        return {
            init: init,
            prosjecnaKvadratura: prosjecnaKvadratura,
            outlier: outlier,
            mojeNekretnine: mojeNekretnine,
            histogramCijena: histogramCijena
        };
    }

    return {
        getInstance: function (listaNekretnina, listaKorisnika) {
            if (!instance) {
                instance = createInstance();
                instance.init(listaNekretnina, listaKorisnika);
            }
            return instance;
        }
    };

})();
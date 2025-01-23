function postaviCarousel(glavniElement, sviElementi, indeks = 0) {
    if (!glavniElement || !Array.isArray(sviElementi) || sviElementi.length === 0 || indeks < 0 || indeks >= sviElementi.length) {
        return null;
    }

    
    function prikaziElement(indeks) {
        glavniElement.innerHTML = sviElementi[indeks].innerHTML;
    }

    
    prikaziElement(indeks);

    
    function fnLijevo() {
        indeks = (indeks - 1 + sviElementi.length) % sviElementi.length;
        prikaziElement(indeks);
    }

    
    function fnDesno() {
        indeks = (indeks + 1) % sviElementi.length;
        prikaziElement(indeks);
    }

    
    return {
        fnLijevo: fnLijevo,
        fnDesno: fnDesno
    };
}

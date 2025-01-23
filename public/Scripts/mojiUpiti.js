document.addEventListener("DOMContentLoaded", function() {
    PoziviAjax.getMojiUpiti(function(error, upiti) {
        const upitiContainer = document.getElementById("upiti-container");

        if (error) {
            upitiContainer.innerHTML = `<p>Greška: ${error.statusText}</p>`;
        } else if (upiti.length === 0) {
            upitiContainer.innerHTML = "<p>Nemate upita.</p>";
        } else {
            const list = document.createElement("ul");
            upiti.forEach((upit) => {
                const item = document.createElement("li");
                item.textContent = `Upit na nekretninu ID: ${upit.id_nekretnine} - ${upit.tekst_upita}`;
                list.appendChild(item);
            });
            upitiContainer.appendChild(list);
        }
    });
});

document.addEventListener("DOMContentLoaded", function() {
    const upiti = document.querySelectorAll('.upit');  
    let indeksUpita = 0;  

    
    function prikaziUpit(indeks) {
        
        upiti.forEach(function(upit) {
            upit.style.display = 'none';
        });

        if (upiti[indeks]) {
            upiti[indeks].style.display = 'block';
        }
    }


    prikaziUpit(indeksUpita);

    const prevButton = document.querySelector('.carousel-button.prev');
    const nextButton = document.querySelector('.carousel-button.next');

    prevButton.addEventListener('click', function() {
        indeksUpita = (indeksUpita - 1 + upiti.length) % upiti.length;  
        prikaziUpit(indeksUpita);
    });

    nextButton.addEventListener('click', function() {
        indeksUpita = (indeksUpita + 1) % upiti.length;  
        prikaziUpit(indeksUpita);
    });

    function updateLayout() {
        if (window.innerWidth > 600) {
            upiti.forEach(function(upit) {
                upit.style.display = 'block';  
            });

            
            prevButton.style.display = 'none';
            nextButton.style.display = 'none';
        } else {
            
            upiti.forEach(function(upit) {
                upit.style.display = 'none';  
            });

            prikaziUpit(indeksUpita);  

            
            prevButton.style.display = 'block';
            nextButton.style.display = 'block';
        }
    }
    
    updateLayout();

    window.addEventListener('resize', updateLayout);
});

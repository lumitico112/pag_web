document.addEventListener('DOMContentLoaded', async () => {
    const select = document.getElementById('pais');

    try {
        const res = await fetch('https://restcountries.com/v3.1/all?fields=name');
        const data = await res.json();

        if (!Array.isArray(data)) throw new Error('La respuesta no es un array');

        const paises = data.map(p => p.name.common).sort();

        paises.forEach(pais => {
            const opt = document.createElement('option');
            opt.value = pais;
            opt.textContent = pais;
            if (pais === 'Peru') opt.selected = true;
            select.appendChild(opt);
        });

        console.log("🌍 Países cargados correctamente desde la API");
    } catch (error) {
        console.error("❌ Error al cargar países:", error);
    }
});

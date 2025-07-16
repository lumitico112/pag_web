// GeoDB Cities API Integration para ubicaciones dinámicas
// Documentación: https://rapidapi.com/wirefreethought/api/geodb-cities

class GeoDBCitiesAPI {
    constructor() {
        // Verificar que la configuración esté disponible
        if (typeof UBICACIONES_CONFIG === 'undefined') {
            console.warn('UBICACIONES_CONFIG no está disponible. GeoDB API no se puede inicializar.');
            this.apiKey = null;
            this.baseUrl = 'https://wft-geo-db.p.rapidapi.com/v1/geo';
            this.headers = {};
            this.initialized = false;
            return;
        }
        
        // Configuración de la API desde la configuración global
        this.apiKey = UBICACIONES_CONFIG.geodb.apiKey;
        this.baseUrl = 'https://wft-geo-db.p.rapidapi.com/v1/geo';
        this.headers = {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
        };
        this.initialized = true;
        
        // Cache para evitar múltiples llamadas a la API
        this.cache = {
            regiones: null,
            provincias: {},
            ciudades: {},
            coordenadas: {}
        };
    }

    // Obtener todas las divisiones administrativas de Perú
    async obtenerRegionesPeru() {
        if (this.cache.regiones) {
            return this.cache.regiones;
        }

        try {
            const url = `${this.baseUrl}/adminDivisions?countryIds=PE&limit=100`;
            const response = await fetch(url, { headers: this.headers });
            
            if (!response.ok) {
                throw new Error(`Error API: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Filtrar y organizar regiones (divisiones de primer nivel)
            const regiones = data.data
                .filter(division => division.level === 1)
                .map(region => ({
                    id: region.id,
                    nombre: region.name,
                    codigo: region.isoCode,
                    wikiDataId: region.wikiDataId
                }))
                .sort((a, b) => a.nombre.localeCompare(b.nombre));
                
            this.cache.regiones = regiones;
            return regiones;
            
        } catch (error) {
            console.error('Error obteniendo regiones:', error);
            // Fallback a datos locales en caso de error
            return this.getFallbackRegiones();
        }
    }

    // Obtener provincias de una región específica
    async obtenerProvinciasPorRegion(regionId) {
        if (this.cache.provincias[regionId]) {
            return this.cache.provincias[regionId];
        }

        try {
            const url = `${this.baseUrl}/adminDivisions?parentId=${regionId}&limit=100`;
            const response = await fetch(url, { headers: this.headers });
            
            if (!response.ok) {
                throw new Error(`Error API: ${response.status}`);
            }
            
            const data = await response.json();
            
            const provincias = data.data.map(provincia => ({
                id: provincia.id,
                nombre: provincia.name,
                regionId: regionId,
                wikiDataId: provincia.wikiDataId
            }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
            
            this.cache.provincias[regionId] = provincias;
            return provincias;
            
        } catch (error) {
            console.error('Error obteniendo provincias:', error);
            return [];
        }
    }

    // Obtener ciudades de una provincia específica
    async obtenerCiudadesPorProvincia(provinciaId, regionNombre = '') {
        const cacheKey = `${provinciaId}_${regionNombre}`;
        
        if (this.cache.ciudades[cacheKey]) {
            return this.cache.ciudades[cacheKey];
        }

        try {
            // Buscar ciudades por provincia y país
            const url = `${this.baseUrl}/cities?countryIds=PE&adminDivisionIds=${provinciaId}&limit=100&sort=population&sortDir=DESC`;
            const response = await fetch(url, { headers: this.headers });
            
            if (!response.ok) {
                throw new Error(`Error API: ${response.status}`);
            }
            
            const data = await response.json();
            
            const ciudades = data.data.map(ciudad => ({
                id: ciudad.id,
                nombre: ciudad.name,
                nombreCompleto: `${ciudad.name}, ${ciudad.region}`,
                poblacion: ciudad.population,
                latitud: ciudad.latitude,
                longitud: ciudad.longitude,
                provinciaId: provinciaId,
                region: ciudad.region,
                pais: ciudad.country,
                wikiDataId: ciudad.wikiDataId
            }))
            .sort((a, b) => b.poblacion - a.poblacion); // Ordenar por población
            
            this.cache.ciudades[cacheKey] = ciudades;
            
            // Guardar coordenadas en cache
            ciudades.forEach(ciudad => {
                this.cache.coordenadas[ciudad.nombre] = {
                    lat: ciudad.latitud,
                    lng: ciudad.longitud
                };
            });
            
            return ciudades;
            
        } catch (error) {
            console.error('Error obteniendo ciudades:', error);
            return [];
        }
    }

    // Buscar ciudades por texto libre
    async buscarCiudades(termino, limite = 20) {
        try {
            const url = `${this.baseUrl}/cities?countryIds=PE&namePrefix=${encodeURIComponent(termino)}&limit=${limite}&sort=population&sortDir=DESC`;
            const response = await fetch(url, { headers: this.headers });
            
            if (!response.ok) {
                throw new Error(`Error API: ${response.status}`);
            }
            
            const data = await response.json();
            
            return data.data.map(ciudad => ({
                id: ciudad.id,
                nombre: ciudad.name,
                nombreCompleto: `${ciudad.name}, ${ciudad.region}`,
                poblacion: ciudad.population,
                latitud: ciudad.latitude,
                longitud: ciudad.longitude,
                region: ciudad.region,
                pais: ciudad.country
            }));
            
        } catch (error) {
            console.error('Error buscando ciudades:', error);
            return [];
        }
    }

    // Obtener coordenadas de una ciudad
    obtenerCoordenadas(nombreCiudad) {
        return this.cache.coordenadas[nombreCiudad] || null;
    }

    // Datos de fallback en caso de que la API no esté disponible
    getFallbackRegiones() {
        return [
            { id: 'lima', nombre: 'Lima', codigo: 'LIM' },
            { id: 'la-libertad', nombre: 'La Libertad', codigo: 'LAL' },
            { id: 'lambayeque', nombre: 'Lambayeque', codigo: 'LAM' },
            { id: 'piura', nombre: 'Piura', codigo: 'PIU' },
            { id: 'cajamarca', nombre: 'Cajamarca', codigo: 'CAJ' },
            { id: 'junin', nombre: 'Junín', codigo: 'JUN' },
            { id: 'arequipa', nombre: 'Arequipa', codigo: 'ARE' },
            { id: 'cusco', nombre: 'Cusco', codigo: 'CUS' },
            { id: 'ica', nombre: 'Ica', codigo: 'ICA' },
            { id: 'huanuco', nombre: 'Huánuco', codigo: 'HUA' }
        ];
    }

    // Verificar si la API está configurada correctamente
    async verificarConfiguracion() {
        if (this.apiKey === 'TU_API_KEY_AQUI') {
            console.warn('GeoDB Cities API no configurada. Usando datos locales.');
            return false;
        }

        try {
            const url = `${this.baseUrl}/countries/PE`;
            const response = await fetch(url, { headers: this.headers });
            return response.ok;
        } catch (error) {
            console.error('Error verificando configuración API:', error);
            return false;
        }
    }

    // Inicializar con configuración de usuario
    configurar(apiKey) {
        this.apiKey = apiKey;
        this.headers['X-RapidAPI-Key'] = apiKey;
    }

    // Limpiar cache
    limpiarCache() {
        this.cache = {
            regiones: null,
            provincias: {},
            ciudades: {},
            coordenadas: {}
        };
    }
}

// Instancia global - se inicializa de forma diferida
let geoDBAPI = null;

// Función para obtener la instancia (inicialización diferida)
function getGeoDBAPI() {
    if (!geoDBAPI) {
        geoDBAPI = new GeoDBCitiesAPI();
    }
    return geoDBAPI;
}

// Funciones de utilidad para integración con el sistema existente
async function cargarRegionesGeoDB(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    // Mostrar loading
    select.innerHTML = '<option value="">Cargando regiones...</option>';

    try {
        const api = getGeoDBAPI();
        if (!api.initialized) {
            throw new Error('GeoDB API no está inicializada correctamente');
        }
        
        const regiones = await api.obtenerRegionesPeru();
        
        select.innerHTML = '<option value="">Seleccionar Región</option>';
        
        regiones.forEach(region => {
            const option = document.createElement('option');
            option.value = region.id;
            option.textContent = region.nombre;
            option.dataset.codigo = region.codigo;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error cargando regiones:', error);
        select.innerHTML = '<option value="">Error cargando regiones</option>';
    }
}

async function cargarProvinciasGeoDB(regionId, selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Cargando provincias...</option>';

    try {
        const api = getGeoDBAPI();
        if (!api.initialized) {
            throw new Error('GeoDB API no está inicializada correctamente');
        }
        
        const provincias = await api.obtenerProvinciasPorRegion(regionId);
        
        select.innerHTML = '<option value="">Seleccionar Provincia</option>';
        
        provincias.forEach(provincia => {
            const option = document.createElement('option');
            option.value = provincia.id;
            option.textContent = provincia.nombre;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error cargando provincias:', error);
        select.innerHTML = '<option value="">Error cargando provincias</option>';
    }
}

async function cargarCiudadesGeoDB(provinciaId, selectId, regionNombre = '') {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Cargando ciudades...</option>';

    try {
        const api = getGeoDBAPI();
        if (!api.initialized) {
            throw new Error('GeoDB API no está inicializada correctamente');
        }
        
        const ciudades = await api.obtenerCiudadesPorProvincia(provinciaId, regionNombre);
        
        select.innerHTML = '<option value="">Seleccionar Ciudad</option>';
        
        ciudades.forEach(ciudad => {
            const option = document.createElement('option');
            option.value = ciudad.nombre;
            option.textContent = `${ciudad.nombre} ${ciudad.poblacion ? `(${ciudad.poblacion.toLocaleString()} hab.)` : ''}`;
            option.dataset.latitud = ciudad.latitud;
            option.dataset.longitud = ciudad.longitud;
            option.dataset.poblacion = ciudad.poblacion;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error cargando ciudades:', error);
        select.innerHTML = '<option value="">Error cargando ciudades</option>';
    }
}

// Función para autocompletar ciudades con búsqueda en tiempo real
async function configurarAutocompletarCiudad(inputId, resultadosId) {
    const input = document.getElementById(inputId);
    const contenedorResultados = document.getElementById(resultadosId);
    
    if (!input || !contenedorResultados) return;

    let timeoutId = null;

    input.addEventListener('input', function() {
        const termino = this.value.trim();
        
        clearTimeout(timeoutId);
        
        if (termino.length < 2) {
            contenedorResultados.innerHTML = '';
            return;
        }

        timeoutId = setTimeout(async () => {
            try {
                contenedorResultados.innerHTML = '<div class="p-2">Buscando...</div>';
                
                const api = getGeoDBAPI();
                if (!api.initialized) {
                    throw new Error('GeoDB API no está inicializada correctamente');
                }
                
                const ciudades = await api.buscarCiudades(termino, 10);
                
                if (ciudades.length === 0) {
                    contenedorResultados.innerHTML = '<div class="p-2 text-muted">No se encontraron ciudades</div>';
                    return;
                }

                let html = '';
                ciudades.forEach(ciudad => {
                    html += `
                        <div class="autocomplete-item p-2 border-bottom cursor-pointer" 
                             onclick="seleccionarCiudadAutocomplete('${ciudad.nombre}', '${ciudad.latitud}', '${ciudad.longitud}', '${inputId}', '${resultadosId}')">
                            <div><strong>${ciudad.nombre}</strong></div>
                            <small class="text-muted">${ciudad.region}, Perú ${ciudad.poblacion ? `• ${ciudad.poblacion.toLocaleString()} hab.` : ''}</small>
                        </div>
                    `;
                });
                
                contenedorResultados.innerHTML = html;
                
            } catch (error) {
                console.error('Error en autocompletado:', error);
                contenedorResultados.innerHTML = '<div class="p-2 text-danger">Error en la búsqueda</div>';
            }
        }, 300);
    });

    // Ocultar resultados al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !contenedorResultados.contains(e.target)) {
            contenedorResultados.innerHTML = '';
        }
    });
}

function seleccionarCiudadAutocomplete(nombre, lat, lng, inputId, resultadosId) {
    document.getElementById(inputId).value = nombre;
    document.getElementById(resultadosId).innerHTML = '';
    
    // Guardar coordenadas para cálculos posteriores
    const api = getGeoDBAPI();
    if (api.initialized) {
        api.cache.coordenadas[nombre] = { lat: parseFloat(lat), lng: parseFloat(lng) };
    }
    
    // Disparar evento de cambio para actualizar cálculos
    const event = new Event('change', { bubbles: true });
    document.getElementById(inputId).dispatchEvent(event);
}

// Exportar para uso global
window.geoDBAPI = getGeoDBAPI; // Función para obtener la instancia
window.getGeoDBAPI = getGeoDBAPI;
window.cargarRegionesGeoDB = cargarRegionesGeoDB;
window.cargarProvinciasGeoDB = cargarProvinciasGeoDB;
window.cargarCiudadesGeoDB = cargarCiudadesGeoDB;
window.configurarAutocompletarCiudad = configurarAutocompletarCiudad;
window.seleccionarCiudadAutocomplete = seleccionarCiudadAutocomplete;

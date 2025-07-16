// Configuración del sistema de ubicaciones
// Permite cambiar entre datos locales y API externa (GeoDB Cities)

const UBICACIONES_CONFIG = {
    // Modo de operación: 'local', 'geodb' o 'hibrido'
    modo: 'local', // Usar sistema local como principal
    
    // Configuración de GeoDB Cities API
    geodb: {
        apiKey: '1d176599f1msh47fbc6e4ae4c94ap1e3f33jsnedb5eb88d65d', // API key configurada
        habilitado: true, // API key habilitada
        cache: true, // Usar cache para reducir llamadas a la API
        limite: 100, // Límite de resultados por consulta
        testMode: false // Modo de prueba para verificar conectividad
    },
    
    // Configuración del sistema local
    local: {
        habilitado: true,
        archivo: 'ubicaciones-peru.js'
    },
    
    // Configuración híbrida
    hibrido: {
        // Usar local como fallback si GeoDB falla
        fallbackLocal: true,
        // Priorizar ciudades principales del sistema local
        priorizarLocal: true,
        // Timeout para API externa (segundos)
        timeoutAPI: 5
    }
};

// Función para cambiar dinámicamente el sistema de ubicaciones
function cambiarSistemaUbicaciones() {
    const selector = document.getElementById('ubicaciones-source');
    const statusElement = document.getElementById('ubicaciones-status');
    
    if (!selector || !statusElement) return;
    
    const nuevoModo = selector.value;
    if (window.UBICACIONES_CONFIG) {
        window.UBICACIONES_CONFIG.modo = nuevoModo;
    } else {
        console.warn('UBICACIONES_CONFIG no disponible al cambiar sistema');
    }
    
    // Actualizar estado visual
    actualizarEstadoUbicaciones(nuevoModo, statusElement);
    
    // Recargar regiones con el nuevo sistema
    recargarRegiones();
}

// Actualizar el estado visual del sistema
function actualizarEstadoUbicaciones(modo, statusElement) {
    let badge = '';
    let descripcion = '';
    
    switch (modo) {
        case 'local':
            badge = '<span class="badge bg-success">Sistema Local Activo</span>';
            descripcion = 'Usando datos locales de ciudades principales del Perú';
            break;
        case 'geodb':
            badge = '<span class="badge bg-info">GeoDB Cities API</span>';
            descripcion = 'Conectando a base de datos mundial...';
            verificarAPIGeoDB(statusElement);
            break;
        case 'hibrido':
            badge = '<span class="badge bg-warning">Modo Híbrido</span>';
            descripcion = 'API externa + fallback local';
            verificarAPIGeoDB(statusElement);
            break;
    }
    
    statusElement.innerHTML = badge + '<br><small class="text-muted">' + descripcion + '</small>';
}

// Verificar conectividad con GeoDB API
async function verificarAPIGeoDB(statusElement) {
    try {
        const response = await fetch(`${API_BASE_URL}/locations.php?action=regions&country=PE&test=true`);
        const data = await response.json();
        
        if (data.success) {
            statusElement.innerHTML = '<span class="badge bg-success">API Conectada</span><br><small class="text-muted">GeoDB Cities funcionando correctamente</small>';
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        statusElement.innerHTML = '<span class="badge bg-danger">API No Disponible</span><br><small class="text-muted">Usando sistema local como fallback</small>';
        // Cambiar automáticamente a local si la API falla
        if (window.UBICACIONES_CONFIG && window.UBICACIONES_CONFIG.modo === 'geodb') {
            window.UBICACIONES_CONFIG.modo = 'local';
            const selectorElement = document.getElementById('ubicaciones-source');
            if (selectorElement) {
                selectorElement.value = 'local';
            }
        }
    }
}

// Recargar regiones después de cambiar el sistema
function recargarRegiones() {
    const regionOrigen = document.getElementById('regionOrigen');
    const regionDestino = document.getElementById('regionDestino');
    
    if (regionOrigen) {
        cargarRegionesSegunSistema('regionOrigen');
    }
    if (regionDestino) {
        cargarRegionesSegunSistema('regionDestino');
    }
}

// Función para verificar qué sistema usar
function obtenerSistemaUbicaciones() {
    if (!window.UBICACIONES_CONFIG) return 'local';
    
    if (window.UBICACIONES_CONFIG.modo === 'geodb' && window.UBICACIONES_CONFIG.geodb.habilitado) {
        return 'geodb';
    } else if (window.UBICACIONES_CONFIG.modo === 'local' && window.UBICACIONES_CONFIG.local.habilitado) {
        return 'local';
    } else {
        // Fallback automático
        return 'local';
    }
}

// Wrapper unificado para cargar regiones
async function cargarRegionesUnificado(selectId) {
    const sistema = obtenerSistemaUbicaciones();
    
    if (sistema === 'geodb') {
        try {
            await cargarRegionesDesdeAPI(selectId);
        } catch (error) {
            console.warn('GeoDB falló, usando sistema local:', error);
            cargarRegiones(selectId);
        }
    } else {
        cargarRegiones(selectId);
    }
}

// Wrapper unificado para cargar provincias
async function cargarProvinciasUnificado(region, selectId) {
    const sistema = obtenerSistemaUbicaciones();
    
    if (sistema === 'geodb') {
        try {
            await cargarProvinciasGeoDB(region, selectId);
        } catch (error) {
            console.warn('GeoDB falló, usando sistema local:', error);
            cargarProvincias(region, selectId);
        }
    } else {
        cargarProvincias(region, selectId);
    }
}

// Wrapper unificado para cargar ciudades
async function cargarCiudadesUnificado(region, provincia, distrito, selectId) {
    const sistema = obtenerSistemaUbicaciones();
    
    if (sistema === 'geodb') {
        try {
            await cargarCiudadesGeoDB(provincia, selectId, region);
        } catch (error) {
            console.warn('GeoDB falló, usando sistema local:', error);
            cargarCiudades(region, provincia, distrito, selectId);
        }
    } else {
        cargarCiudades(region, provincia, distrito, selectId);
    }
}

// Wrapper unificado para obtener coordenadas
function obtenerCoordenadasUnificado(ciudad) {
    const sistema = obtenerSistemaUbicaciones();
    
    if (sistema === 'geodb') {
        const coordsGeoDB = geoDBAPI.obtenerCoordenadas(ciudad);
        if (coordsGeoDB) {
            return coordsGeoDB;
        }
    }
    
    // Fallback al sistema local
    return obtenerCoordenadas(ciudad);
}

// Función para configurar el sistema según las preferencias
function configurarSistemaUbicaciones(config) {
    if (!window.UBICACIONES_CONFIG) {
        console.warn('UBICACIONES_CONFIG no disponible para configurar');
        return;
    }
    
    Object.assign(window.UBICACIONES_CONFIG, config);
    
    // Si se configura GeoDB, inicializar la API
    if (window.UBICACIONES_CONFIG.modo === 'geodb' && window.UBICACIONES_CONFIG.geodb.apiKey !== 'TU_API_KEY_AQUI') {
        if (window.geoDBAPI && window.geoDBAPI.configurar) {
            window.geoDBAPI.configurar(window.UBICACIONES_CONFIG.geodb.apiKey);
        }
        window.UBICACIONES_CONFIG.geodb.habilitado = true;
    }
}

// Función para mostrar modal de configuración de ubicaciones
function mostrarConfiguracionUbicaciones() {
    const modalHtml = `
        <div class="modal fade" id="modalConfigUbicaciones" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-map-marked-alt"></i> Configuración de Ubicaciones
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Sistema de Ubicaciones</label>
                            <select class="form-control" id="sistemaUbicaciones">
                                <option value="local" ${UBICACIONES_CONFIG.modo === 'local' ? 'selected' : ''}>
                                    Sistema Local (Predefinido)
                                </option>
                                <option value="geodb" ${UBICACIONES_CONFIG.modo === 'geodb' ? 'selected' : ''}>
                                    GeoDB Cities API (Dinámico)
                                </option>
                            </select>
                            <small class="text-muted">
                                Sistema local usa datos predefinidos. GeoDB Cities proporciona datos actualizados.
                            </small>
                        </div>
                        
                        <div id="configGeoDB" style="display: ${UBICACIONES_CONFIG.modo === 'geodb' ? 'block' : 'none'};">
                            <div class="mb-3">
                                <label class="form-label">API Key de GeoDB Cities</label>
                                <input type="text" class="form-control" id="apiKeyGeoDB" 
                                       value="${UBICACIONES_CONFIG.geodb.apiKey}" 
                                       placeholder="Obtener en RapidAPI">
                                <small class="text-muted">
                                    <a href="https://rapidapi.com/wirefreethought/api/geodb-cities" target="_blank">
                                        Obtener API Key gratuita
                                    </a>
                                </small>
                            </div>
                            
                            <div class="alert alert-info">
                                <h6>Ventajas de GeoDB Cities:</h6>
                                <ul class="mb-0">
                                    <li>Datos actualizados automáticamente</li>
                                    <li>Más de 195,000 ciudades globalmente</li>
                                    <li>Coordenadas GPS precisas</li>
                                    <li>Información de población</li>
                                    <li>Búsqueda y autocompletado avanzado</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div id="configLocal" style="display: ${UBICACIONES_CONFIG.modo === 'local' ? 'block' : 'none'};">
                            <div class="alert alert-success">
                                <h6>Sistema Local:</h6>
                                <ul class="mb-0">
                                    <li>✅ No requiere conexión a internet</li>
                                    <li>✅ Respuesta instantánea</li>
                                    <li>✅ Datos curados para Perú</li>
                                    <li>✅ Control total sobre los datos</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" onclick="guardarConfiguracionUbicaciones()">
                            <i class="fas fa-save"></i> Guardar Configuración
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal anterior si existe
    const modalAnterior = document.getElementById('modalConfigUbicaciones');
    if (modalAnterior) {
        modalAnterior.remove();
    }
    
    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Configurar eventos
    document.getElementById('sistemaUbicaciones').addEventListener('change', function() {
        const sistema = this.value;
        document.getElementById('configGeoDB').style.display = sistema === 'geodb' ? 'block' : 'none';
        document.getElementById('configLocal').style.display = sistema === 'local' ? 'block' : 'none';
    });
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('modalConfigUbicaciones'));
    modal.show();
}

async function guardarConfiguracionUbicaciones() {
    const sistema = document.getElementById('sistemaUbicaciones').value;
    const apiKey = document.getElementById('apiKeyGeoDB').value;
    
    const nuevaConfig = {
        modo: sistema
    };
    
    if (sistema === 'geodb') {
        if (!apiKey || apiKey === 'TU_API_KEY_AQUI') {
            alert('Por favor ingresa una API Key válida para GeoDB Cities');
            return;
        }
        
        nuevaConfig.geodb = {
            ...UBICACIONES_CONFIG.geodb,
            apiKey: apiKey,
            habilitado: true
        };
    }
    
    // Aplicar configuración
    configurarSistemaUbicaciones(nuevaConfig);
    
    // Guardar en localStorage
    localStorage.setItem('ubicaciones_config', JSON.stringify(UBICACIONES_CONFIG));
    
    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfigUbicaciones'));
    modal.hide();
    
    // Mostrar confirmación
    alert(`Configuración guardada. Sistema: ${sistema === 'geodb' ? 'GeoDB Cities API' : 'Sistema Local'}`);
    
    // Recargar formulario si está abierto
    if (document.getElementById('formRuta').style.display === 'block') {
        cargarRegionesUnificado('regionOrigen');
        cargarRegionesUnificado('regionDestino');
    }
}

// Cargar configuración guardada al inicializar
function cargarConfiguracionGuardada() {
    const configGuardada = localStorage.getItem('ubicaciones_config');
    if (configGuardada) {
        try {
            const config = JSON.parse(configGuardada);
            configurarSistemaUbicaciones(config);
        } catch (error) {
            console.warn('Error cargando configuración guardada:', error);
        }
    }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarConfiguracionGuardada();
});

// Funciones para usar la API de ubicaciones PHP
async function cargarRegionesDesdeAPI(selectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/locations.php?action=regions&country=PE`);
        const data = await response.json();
        
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // Limpiar opciones existentes
        select.innerHTML = '<option value="">Seleccionar Región</option>';
        
        if (data.success && data.regions) {
            data.regions.forEach(region => {
                const option = document.createElement('option');
                option.value = region.id;
                option.textContent = region.name;
                select.appendChild(option);
            });
        } else {
            console.warn('Error al cargar regiones desde API:', data.error);
            // Fallback a sistema local
            await cargarRegionesLocal(selectId);
        }
    } catch (error) {
        console.error('Error al cargar regiones desde API:', error);
        // Fallback a sistema local
        await cargarRegionesLocal(selectId);
    }
}

async function cargarCiudadesDesdeAPI(selectId, regionId) {
    try {
        const response = await fetch(`${API_BASE_URL}/locations.php?action=cities&region=${regionId}&country=PE`);
        const data = await response.json();
        
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // Limpiar opciones existentes
        select.innerHTML = '<option value="">Seleccionar Ciudad</option>';
        
        if (data.success && data.cities) {
            data.cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city.id;
                option.textContent = city.name;
                option.dataset.latitude = city.latitude;
                option.dataset.longitude = city.longitude;
                select.appendChild(option);
            });
        } else {
            console.warn('Error al cargar ciudades desde API:', data.error);
            // Fallback a sistema local
            await cargarCiudadesLocal(selectId, regionId);
        }
    } catch (error) {
        console.error('Error al cargar ciudades desde API:', error);
        // Fallback a sistema local
        await cargarCiudadesLocal(selectId, regionId);
    }
}

async function calcularDistanciaAPI(city1Id, city2Id) {
    try {
        const response = await fetch(`${API_BASE_URL}/locations.php?action=distance&city1=${city1Id}&city2=${city2Id}`);
        const data = await response.json();
        
        if (data.success) {
            return {
                distancia: data.distance,
                precio: data.price,
                duracion: data.duration,
                duracionHoras: data.durationHours
            };
        } else {
            console.warn('Error al calcular distancia:', data.error);
            return null;
        }
    } catch (error) {
        console.error('Error al calcular distancia:', error);
        return null;
    }
}

// Funciones de fallback usando sistema local
async function cargarRegionesLocal(selectId) {
    // Usar sistema local como fallback
    if (typeof cargarRegiones === 'function') {
        cargarRegiones(selectId);
    }
}

async function cargarCiudadesLocal(selectId, regionId) {
    // Usar sistema local como fallback
    if (typeof cargarCiudades === 'function') {
        cargarCiudades(selectId, regionId);
    }
}

// Función principal para cargar regiones según el sistema configurado
async function cargarRegionesSegunSistema(selectId) {
    const sistema = (window.UBICACIONES_CONFIG && window.UBICACIONES_CONFIG.modo) || 'local';
    
    switch (sistema) {
        case 'geodb':
            try {
                await cargarRegionesDesdeAPI(selectId);
            } catch (error) {
                console.warn('API fallback:', error);
                await cargarRegionesLocal(selectId);
            }
            break;
        case 'hibrido':
            try {
                await cargarRegionesDesdeAPI(selectId);
            } catch (error) {
                console.warn('API fallback:', error);
                await cargarRegionesLocal(selectId);
            }
            break;
        case 'local':
        default:
            await cargarRegionesLocal(selectId);
            break;
    }
}

// Función para cargar ciudades según el sistema configurado
async function cargarCiudadesSegunSistema(selectId, regionValue) {
    const sistema = (window.UBICACIONES_CONFIG && window.UBICACIONES_CONFIG.modo) || 'local';
    
    switch (sistema) {
        case 'geodb':
            try {
                await cargarCiudadesDesdeAPI(selectId, regionValue);
            } catch (error) {
                console.warn('API fallback:', error);
                cargarCiudadesLocal(selectId, regionValue);
            }
            break;
        case 'hibrido':
            try {
                await cargarCiudadesDesdeAPI(selectId, regionValue);
            } catch (error) {
                console.warn('API fallback:', error);
                cargarCiudadesLocal(selectId, regionValue);
            }
            break;
        case 'local':
        default:
            cargarCiudadesLocal(selectId, regionValue);
            break;
    }
}

// Función para calcular distancia según el sistema configurado
async function calcularDistanciaSegunSistema(city1Id, city2Id) {
    const sistema = (window.UBICACIONES_CONFIG && window.UBICACIONES_CONFIG.modo) || 'local';
    
    if (sistema === 'geodb' || sistema === 'hibrido') {
        try {
            const resultado = await calcularDistanciaAPI(city1Id, city2Id);
            if (resultado) return resultado;
        } catch (error) {
            console.warn('Cálculo API fallback:', error);
        }
    }
    
    // Fallback a cálculo local
    return calcularDistanciaLocal(city1Id, city2Id);
}

// Función de cálculo local mejorada
function calcularDistanciaLocal(origenText, destinoText) {
    // Base de datos de rutas reales con distancias, tiempos y precios precisos
    const rutasReales = {
        // Rutas desde Lima
        'Lima-Arequipa': { distancia: 1009, duracion: '15:30', precio: 85 },
        'Lima-Trujillo': { distancia: 558, duracion: '8:45', precio: 65 },
        'Lima-Chiclayo': { distancia: 770, duracion: '12:00', precio: 75 },
        'Lima-Lambayeque': { distancia: 557, duracion: '8:55', precio: 70 },
        'Lima-Huancayo': { distancia: 305, duracion: '6:30', precio: 45 },
        'Lima-Cusco': { distancia: 1165, duracion: '20:00', precio: 95 },
        'Lima-Piura': { distancia: 973, duracion: '14:45', precio: 80 },
        'Lima-Huaraz': { distancia: 408, duracion: '8:00', precio: 55 },
        'Lima-Chimbote': { distancia: 431, duracion: '7:30', precio: 50 },
        'Lima-Barranca': { distancia: 193, duracion: '3:30', precio: 35 },
        'Lima-Huacho': { distancia: 148, duracion: '2:45', precio: 30 },
        'Lima-Huaral': { distancia: 82, duracion: '1:45', precio: 25 },
        'Lima-Cañete': { distancia: 144, duracion: '2:30', precio: 28 },
        
        // Rutas desde Arequipa
        'Arequipa-Cusco': { distancia: 521, duracion: '10:00', precio: 60 },
        'Arequipa-Trujillo': { distancia: 1024, duracion: '16:00', precio: 85 },
        'Arequipa-Chiclayo': { distancia: 1200, duracion: '18:00', precio: 95 },
        'Arequipa-Huancayo': { distancia: 956, duracion: '15:30', precio: 80 },
        
        // Rutas desde Trujillo
        'Trujillo-Chiclayo': { distancia: 209, duracion: '3:30', precio: 40 },
        'Trujillo-Lambayeque': { distancia: 188, duracion: '3:00', precio: 38 },
        'Trujillo-Piura': { distancia: 415, duracion: '6:30', precio: 55 },
        'Trujillo-Chimbote': { distancia: 127, duracion: '2:15', precio: 30 },
        'Trujillo-Huaraz': { distancia: 318, duracion: '6:00', precio: 45 },
        
        // Rutas desde Chiclayo
        'Chiclayo-Lambayeque': { distancia: 12, duracion: '0:20', precio: 15 },
        'Chiclayo-Piura': { distancia: 206, duracion: '3:15', precio: 35 },
        'Chiclayo-Cajamarca': { distancia: 255, duracion: '5:00', precio: 45 },
        
        // Rutas desde Cusco
        'Cusco-Arequipa': { distancia: 521, duracion: '10:00', precio: 60 },
        'Cusco-Huancayo': { distancia: 591, duracion: '12:00', precio: 70 },
        'Cusco-Ayacucho': { distancia: 587, duracion: '12:30', precio: 65 },
        
        // Rutas desde Huancayo
        'Huancayo-Ayacucho': { distancia: 255, duracion: '5:30', precio: 40 },
        'Huancayo-Tarma': { distancia: 61, duracion: '1:30', precio: 20 },
        'Huancayo-Huaraz': { distancia: 344, duracion: '7:00', precio: 50 },
        
        // Rutas adicionales importantes
        'Piura-Sullana': { distancia: 38, duracion: '0:45', precio: 18 },
        'Piura-Paita': { distancia: 57, duracion: '1:00', precio: 20 },
        'Huaraz-Casma': { distancia: 150, duracion: '3:00', precio: 35 },
        'Huaraz-Chimbote': { distancia: 200, duracion: '4:00', precio: 40 }
    };
    
    // Obtener coordenadas para cálculo de respaldo
    const ciudadesInfo = {
        'Lima': { lat: -12.0464, lng: -77.0428 },
        'Callao': { lat: -12.0566, lng: -77.1184 },
        'Arequipa': { lat: -16.4090, lng: -71.5375 },
        'Trujillo': { lat: -8.1116, lng: -79.0297 },
        'Chiclayo': { lat: -6.7714, lng: -79.8374 },
        'Huancayo': { lat: -12.0653, lng: -75.2049 },
        'Cusco': { lat: -13.5319, lng: -71.9675 },
        'Barranca': { lat: -10.7500, lng: -77.7667 },
        'Huacho': { lat: -11.1070, lng: -77.6050 },
        'Huaral': { lat: -11.4950, lng: -77.2050 },
        'Cañete': { lat: -13.0773, lng: -76.3858 },
        'Camaná': { lat: -16.6244, lng: -72.7111 },
        'Mollendo': { lat: -17.0233, lng: -72.0146 },
        'Chepén': { lat: -7.2236, lng: -79.4267 },
        'Pacasmayo': { lat: -7.4003, lng: -79.5714 },
        'Lambayeque': { lat: -6.7014, lng: -79.9061 },
        'Ferreñafe': { lat: -6.6389, lng: -79.7889 },
        'Tarma': { lat: -11.4189, lng: -75.6906 },
        'La Oroya': { lat: -11.5186, lng: -75.8997 },
        'Urubamba': { lat: -13.3050, lng: -72.1181 },
        'Pisac': { lat: -13.4172, lng: -71.8469 },
        'Sullana': { lat: -4.9039, lng: -80.6856 },
        'Paita': { lat: -5.0892, lng: -81.1144 },
        'Huaraz': { lat: -9.5277, lng: -77.5278 },
        'Chimbote': { lat: -9.0853, lng: -78.5783 },
        'Casma': { lat: -9.4681, lng: -78.3072 },
        'Piura': { lat: -5.1945, lng: -80.6328 },
        'Ayacucho': { lat: -13.1586, lng: -74.2235 },
        'Cajamarca': { lat: -7.1637, lng: -78.5000 }
    };
    
    // Normalizar nombres de ciudades (quitar acentos y caracteres especiales)
    function normalizarNombre(nombre) {
        return nombre
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .trim();
    }
    
    const origenNorm = normalizarNombre(origenText);
    const destinoNorm = normalizarNombre(destinoText);
    
    // Intentar encontrar ruta directa
    const rutaDirecta = `${origenNorm}-${destinoNorm}`;
    const rutaInversa = `${destinoNorm}-${origenNorm}`;
    
    if (rutasReales[rutaDirecta]) {
        const ruta = rutasReales[rutaDirecta];
        return {
            distancia: ruta.distancia,
            precio: ruta.precio,
            duracion: ruta.duracion,
            duracionHoras: convertirDuracionAHoras(ruta.duracion)
        };
    }
    
    if (rutasReales[rutaInversa]) {
        const ruta = rutasReales[rutaInversa];
        return {
            distancia: ruta.distancia,
            precio: ruta.precio,
            duracion: ruta.duracion,
            duracionHoras: convertirDuracionAHoras(ruta.duracion)
        };
    }
    
    // Si no hay ruta predefinida, calcular usando Haversine como respaldo
    const origen = ciudadesInfo[origenNorm] || ciudadesInfo[origenText];
    const destino = ciudadesInfo[destinoNorm] || ciudadesInfo[destinoText];
    
    if (!origen || !destino) {
        // Valores por defecto si no se encuentra la ciudad
        return {
            distancia: 100,
            precio: 25.00,
            duracion: '02:00',
            duracionHoras: 2
        };
    }
    
    // Calcular distancia usando fórmula de Haversine
    const R = 6371; // Radio de la Tierra en km
    const dLat = (destino.lat - origen.lat) * Math.PI / 180;
    const dLng = (destino.lng - origen.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(origen.lat * Math.PI / 180) * Math.cos(destino.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanciaLinea = R * c;
    
    // Aplicar factor de corrección para distancia por carretera (típicamente 1.3-1.5x)
    const factorCarretera = 1.4;
    const distancia = distanciaLinea * factorCarretera;
    
    // Calcular precio más realista (S/ 20 base + S/ 0.08 por km)
    const precio = 20 + (distancia * 0.08);
    
    // Calcular duración más realista (45 km/h promedio para carreteras)
    const duracionHoras = distancia / 45;
    const horas = Math.floor(duracionHoras);
    const minutos = Math.round((duracionHoras - horas) * 60);
    
    return {
        distancia: Math.round(distancia * 10) / 10,
        precio: Math.round(precio * 100) / 100,
        duracion: `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`,
        duracionHoras: duracionHoras
    };
}

// Función auxiliar para convertir duración "HH:MM" a horas decimales
function convertirDuracionAHoras(duracionString) {
    const [horas, minutos] = duracionString.split(':').map(Number);
    return horas + (minutos / 60);
}

// Función local para cargar ciudades mejorada
function cargarCiudadesLocal(selectId, region) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const ciudadesPorRegion = {
        'LIMA': ['Lima', 'Callao', 'Barranca', 'Huacho', 'Huaral', 'Cañete'],
        'AREQUIPA': ['Arequipa', 'Camaná', 'Mollendo'],
        'LA_LIBERTAD': ['Trujillo', 'Chepén', 'Pacasmayo'],
        'LAMBAYEQUE': ['Chiclayo', 'Lambayeque', 'Ferreñafe'],
        'JUNIN': ['Huancayo', 'Tarma', 'La Oroya'],
        'CUSCO': ['Cusco', 'Urubamba', 'Pisac'],
        'PIURA': ['Piura', 'Sullana', 'Paita'],
        'ANCASH': ['Huaraz', 'Chimbote', 'Casma']
    };
    
    select.innerHTML = '<option value="">Seleccionar Ciudad</option>';
    
    const ciudades = ciudadesPorRegion[region] || [];
    ciudades.forEach(ciudad => {
        const option = document.createElement('option');
        option.value = ciudad;
        option.textContent = ciudad;
        select.appendChild(option);
    });
}

// Exportar funciones principales al ámbito global
window.UBICACIONES_CONFIG = UBICACIONES_CONFIG;

// Funciones principales para el sistema de ubicaciones
window.cambiarSistemaUbicaciones = cambiarSistemaUbicaciones;
window.actualizarEstadoUbicaciones = actualizarEstadoUbicaciones;
window.verificarAPIGeoDB = verificarAPIGeoDB;
window.recargarRegiones = recargarRegiones;
window.obtenerSistemaUbicaciones = obtenerSistemaUbicaciones;

// Funciones de carga de datos
window.cargarRegionesSegunSistema = cargarRegionesSegunSistema;
window.cargarCiudadesSegunSistema = cargarCiudadesSegunSistema;
window.calcularDistanciaSegunSistema = calcularDistanciaSegunSistema;

// Funciones unificadas (alternativas)
window.cargarRegionesUnificado = cargarRegionesUnificado;
window.cargarProvinciasUnificado = cargarProvinciasUnificado;
window.cargarCiudadesUnificado = cargarCiudadesUnificado;
window.obtenerCoordenadasUnificado = obtenerCoordenadasUnificado;

// Funciones de configuración
window.mostrarConfiguracionUbicaciones = mostrarConfiguracionUbicaciones;
window.configurarSistemaUbicaciones = configurarSistemaUbicaciones;

// Funciones de apoyo locales
window.cargarRegionesLocal = cargarRegionesLocal;
window.cargarCiudadesLocal = cargarCiudadesLocal;
window.calcularDistanciaLocal = calcularDistanciaLocal;
window.convertirDuracionAHoras = convertirDuracionAHoras;

console.log('✅ Sistema de ubicaciones cargado - Funciones disponibles globalmente');

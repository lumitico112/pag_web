// Admin Rutas - Gestión de rutas para administradores

class AdminRutas {
  constructor() {
    this.rutaEditando = null;
    this.duracionTimeout = null; // Para debounce del cálculo de fecha de llegada
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.configurarEventosUbicacion();
    this.configurarModoEdicion(); // Inicializar modo de edición
    this.configurarValidaciones(); // Inicializar validaciones en tiempo real
  }

  setupEventListeners() {
    // Form submission
    const rutaForm = document.getElementById('rutaForm');
    if (rutaForm) {
      rutaForm.addEventListener('submit', this.handleSubmitRuta.bind(this));
    }
  }

  // Mostrar formulario de nueva ruta
  mostrarFormularioRuta() {
    document.getElementById('form-ruta-container').style.display = 'block';
    document.getElementById('form-title').innerHTML = '<i class="fas fa-plus"></i> Nueva Ruta';
    
    // Inicializar configuración de ubicaciones
    this.inicializarSistemaUbicaciones();
    
    // Cargar regiones usando el sistema configurado
    if (window.cargarRegionesSegunSistema) {
      window.cargarRegionesSegunSistema('regionOrigen');
      window.cargarRegionesSegunSistema('regionDestino');
    } else {
      // Fallback al sistema manual
      this.cargarRegionesManual('regionOrigen');
      this.cargarRegionesManual('regionDestino');
    }
    
    // Establecer fecha mínima como hoy
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaSalida').setAttribute('min', hoy);
    
    // Limpiar formulario
    document.getElementById('rutaForm').reset();
    document.getElementById('capacidad').value = '40';
    document.getElementById('estado').value = 'activo';
    this.rutaEditando = null;
    
    // Scroll to form
    document.getElementById('form-ruta-container').scrollIntoView({ behavior: 'smooth' });
  }

  inicializarSistemaUbicaciones() {
    // Establecer el valor inicial del selector
    const selector = document.getElementById('ubicaciones-source');
    if (selector) {
      // Verificar que UBICACIONES_CONFIG esté disponible
      if (window.UBICACIONES_CONFIG) {
        selector.value = window.UBICACIONES_CONFIG.modo;
      } else {
        console.warn('UBICACIONES_CONFIG no disponible, usando local por defecto');
        selector.value = 'local';
      }
      
      // Actualizar estado inicial
      const statusElement = document.getElementById('ubicaciones-status');
      if (statusElement) {
        if (window.actualizarEstadoUbicaciones) {
          const modo = selector.value;
          window.actualizarEstadoUbicaciones(modo, statusElement);
        } else {
          // Fallback manual
          statusElement.innerHTML = '<span class="badge bg-success">Sistema Local Activo</span>';
        }
      }
      
      // Configurar evento de cambio
      selector.addEventListener('change', () => {
        const nuevoModo = selector.value;
        if (window.UBICACIONES_CONFIG) {
          window.UBICACIONES_CONFIG.modo = nuevoModo;
        }
        
        if (window.actualizarEstadoUbicaciones && statusElement) {
          window.actualizarEstadoUbicaciones(nuevoModo, statusElement);
        }
        
        // Recargar regiones
        this.recargarRegionesEnFormulario();
      });
    }
  }

  recargarRegionesEnFormulario() {
    // Limpiar selectores dependientes
    this.limpiarSelectores(['provinciaOrigen', 'ciudadOrigen', 'provinciaDestino', 'ciudadDestino']);
    
    // Recargar regiones
    if (window.cargarRegionesSegunSistema) {
      window.cargarRegionesSegunSistema('regionOrigen');
      window.cargarRegionesSegunSistema('regionDestino');
    } else {
      // Fallback a sistema manual
      this.cargarRegionesManual('regionOrigen');
      this.cargarRegionesManual('regionDestino');
    }
  }

  cargarRegionesManual(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccionar Región</option>';
    
    // Usar datos de UBICACIONES_PERU si están disponibles
    if (typeof UBICACIONES_PERU !== 'undefined') {
      const regiones = Object.keys(UBICACIONES_PERU);
      regiones.forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        select.appendChild(option);
      });
    } else {
      // Fallback a regiones básicas
      const regiones = ['Lima', 'Arequipa', 'La Libertad', 'Lambayeque', 'Junín', 'Cusco', 'Piura', 'Ancash'];
      regiones.forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        select.appendChild(option);
      });
    }
  }

  ocultarFormularioRuta() {
    document.getElementById('form-ruta-container').style.display = 'none';
    this.rutaEditando = null;
  }

  // Configurar eventos de cambio para los selectores de ubicación
  configurarEventosUbicacion() {
    // Eventos para origen - Región
    const regionOrigen = document.getElementById('regionOrigen');
    if (regionOrigen) {
      regionOrigen.addEventListener('change', async () => {
        const region = regionOrigen.value;
        this.limpiarSelectores(['provinciaOrigen', 'ciudadOrigen']);
        
        if (region) {
          await this.cargarProvincias('provinciaOrigen', region);
        }
        this.actualizarCalculos();
      });
    }
    
    // Eventos para origen - Provincia
    const provinciaOrigen = document.getElementById('provinciaOrigen');
    if (provinciaOrigen) {
      provinciaOrigen.addEventListener('change', async () => {
        const region = document.getElementById('regionOrigen').value;
        const provincia = provinciaOrigen.value;
        this.limpiarSelectores(['ciudadOrigen']);
        
        if (region && provincia) {
          await this.cargarCiudades('ciudadOrigen', region, provincia);
        }
        this.actualizarCalculos();
      });
    }
    
    // Eventos para origen - Ciudad
    const ciudadOrigen = document.getElementById('ciudadOrigen');
    if (ciudadOrigen) {
      ciudadOrigen.addEventListener('change', () => {
        this.actualizarCalculos();
      });
    }

    // Eventos para destino - Región
    const regionDestino = document.getElementById('regionDestino');
    if (regionDestino) {
      regionDestino.addEventListener('change', async () => {
        const region = regionDestino.value;
        this.limpiarSelectores(['provinciaDestino', 'ciudadDestino']);
        
        if (region) {
          await this.cargarProvincias('provinciaDestino', region);
        }
        this.actualizarCalculos();
      });
    }
    
    // Eventos para destino - Provincia
    const provinciaDestino = document.getElementById('provinciaDestino');
    if (provinciaDestino) {
      provinciaDestino.addEventListener('change', async () => {
        const region = document.getElementById('regionDestino').value;
        const provincia = provinciaDestino.value;
        this.limpiarSelectores(['ciudadDestino']);
        
        if (region && provincia) {
          await this.cargarCiudades('ciudadDestino', region, provincia);
        }
        this.actualizarCalculos();
      });
    }
    
    // Eventos para destino - Ciudad
    const ciudadDestino = document.getElementById('ciudadDestino');
    if (ciudadDestino) {
      ciudadDestino.addEventListener('change', () => {
        this.actualizarCalculos();
        this.actualizarImagenAutomatica(); // Actualizar imagen cuando cambie destino
      });
    }

    // Eventos para el sistema de imágenes
    this.configurarSistemaImagenes();

    // Eventos para fechas y horas
    const fechaSalida = document.getElementById('fechaSalida');
    const horaSalida = document.getElementById('horaSalida');
    
    if (fechaSalida) {
      fechaSalida.addEventListener('change', () => {
        this.actualizarFechaLlegada();
      });
    }
    
    if (horaSalida) {
      horaSalida.addEventListener('change', () => {
        this.actualizarFechaLlegada();
      });
    }
  }

  cargarCiudadesManual(selectId, region) {
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

  // Función para cargar provincias de una región
  cargarProvincias(selectId, region) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccionar Provincia</option>';
    
    // Usar datos locales de UBICACIONES_PERU
    if (typeof UBICACIONES_PERU !== 'undefined' && UBICACIONES_PERU[region]) {
      const provincias = Object.keys(UBICACIONES_PERU[region]);
      provincias.forEach(provincia => {
        const option = document.createElement('option');
        option.value = provincia;
        option.textContent = provincia;
        select.appendChild(option);
      });
    } else {
      // Fallback a provincias básicas
      this.cargarProvinciasFallback(selectId, region);
    }
  }

  // Función para cargar ciudades de una provincia
  cargarCiudades(selectId, region, provincia) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccionar Ciudad</option>';
    
    // Usar datos locales de UBICACIONES_PERU
    if (typeof UBICACIONES_PERU !== 'undefined' && 
        UBICACIONES_PERU[region] && 
        UBICACIONES_PERU[region][provincia]) {
      
      const distritos = Object.keys(UBICACIONES_PERU[region][provincia]);
      distritos.forEach(distrito => {
        const option = document.createElement('option');
        option.value = distrito;
        option.textContent = distrito;
        select.appendChild(option);
      });
    } else {
      // Fallback a ciudades básicas
      this.cargarCiudadesFallback(selectId, region, provincia);
    }
  }

  // Fallback para provincias cuando no hay datos completos
  cargarProvinciasFallback(selectId, region) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const provinciasPorRegion = {
      'Lima': ['Lima', 'Huaral', 'Barranca', 'Huaura', 'Cañete'],
      'La Libertad': ['Trujillo', 'Chepén', 'Pacasmayo', 'Ascope'],
      'Lambayeque': ['Chiclayo', 'Lambayeque', 'Ferreñafe'],
      'Junín': ['Huancayo', 'Tarma', 'Jauja'],
      'Cusco': ['Cusco', 'Urubamba', 'Calca'],
      'Arequipa': ['Arequipa', 'Camaná', 'Islay'],
      'Piura': ['Piura', 'Sullana', 'Paita'],
      'Ancash': ['Huaraz', 'Santa', 'Casma']
    };
    
    const provincias = provinciasPorRegion[region] || [];
    provincias.forEach(provincia => {
      const option = document.createElement('option');
      option.value = provincia;
      option.textContent = provincia;
      select.appendChild(option);
    });
  }

  // Fallback para ciudades cuando no hay datos completos
  cargarCiudadesFallback(selectId, region, provincia) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Crear un mapeo simplificado para ciudades principales
    const ciudadesPorProvincia = {
      'Lima': ['Lima Centro', 'Miraflores', 'San Isidro', 'Barranco', 'Callao'],
      'Huaral': ['Huaral', 'Chancay'],
      'Barranca': ['Barranca', 'Supe', 'Paramonga'],
      'Huaura': ['Huacho', 'Vegueta'],
      'Cañete': ['San Vicente de Cañete', 'Mala', 'Asia'],
      'Trujillo': ['Trujillo', 'La Esperanza', 'Huanchaco'],
      'Chepén': ['Chepén', 'Pacanga'],
      'Pacasmayo': ['Pacasmayo', 'San Pedro de Lloc'],
      'Chiclayo': ['Chiclayo', 'José Leonardo Ortiz', 'Pimentel'],
      'Lambayeque': ['Lambayeque', 'Túcume', 'Motupe'],
      'Ferreñafe': ['Ferreñafe', 'Pueblo Nuevo'],
      'Huancayo': ['Huancayo', 'El Tambo', 'Chilca'],
      'Tarma': ['Tarma', 'Acobamba'],
      'Cusco': ['Cusco', 'San Blas', 'Wanchaq'],
      'Arequipa': ['Arequipa', 'Cayma', 'Yanahuara'],
      'Piura': ['Piura', 'Castilla'],
      'Sullana': ['Sullana', 'Bellavista'],
      'Huaraz': ['Huaraz', 'Independencia']
    };
    
    const ciudades = ciudadesPorProvincia[provincia] || [provincia];
    ciudades.forEach(ciudad => {
      const option = document.createElement('option');
      option.value = ciudad;
      option.textContent = ciudad;
      select.appendChild(option);
    });
  }

  limpiarSelectores(selectores) {
    selectores.forEach(selectorId => {
      const selector = document.getElementById(selectorId);
      if (selector) {
        let placeholder = 'Seleccionar...';
        if (selectorId.includes('region')) {
          placeholder = 'Seleccionar Región';
        } else if (selectorId.includes('provincia')) {
          placeholder = 'Seleccionar Provincia';
        } else if (selectorId.includes('ciudad')) {
          placeholder = 'Seleccionar Ciudad';
        }
        selector.innerHTML = `<option value="">${placeholder}</option>`;
      }
    });
  }

  async actualizarCalculos() {
    const ciudadOrigen = document.getElementById('ciudadOrigen').value;
    const ciudadDestino = document.getElementById('ciudadDestino').value;
    
    if (!ciudadOrigen || !ciudadDestino) {
      // Limpiar campos calculados
      document.getElementById('distancia').value = '';
      document.getElementById('precio').value = '';
      document.getElementById('duracion').value = '';
      return;
    }

    if (ciudadOrigen === ciudadDestino) {
      this.showAlert('El origen y destino no pueden ser iguales', 'warning');
      return;
    }

    try {
      // Calcular siempre usando la fórmula local
      let calculo = this.calcularDatosLocal();
       
       if (calculo) {
        // Actualizar campos con los datos calculados
        document.getElementById('distancia').value = calculo.distancia;
        document.getElementById('precio').value = calculo.precio;
        document.getElementById('duracion').value = calculo.duracion;
        
        // Mostrar información del sistema usado
        this.mostrarInfoCalculo(calculo);
      } else {
        throw new Error('No se pudo calcular la ruta');
      }
      
      // Actualizar fecha de llegada
      this.actualizarFechaLlegada();
      
    } catch (error) {
      console.error('Error calculando datos de ruta:', error);
      this.showAlert('Error al calcular datos de la ruta: ' + error.message, 'warning');
    }
  }

  mostrarInfoCalculo(calculo) {
    // Actualizar indicador del sistema usado
    let sistemaActual = 'local'; // Default
    if (window.UBICACIONES_CONFIG && window.UBICACIONES_CONFIG.modo) {
      sistemaActual = window.UBICACIONES_CONFIG.modo;
    }
    
    const infoSistema = {
      'local': 'Local',
      'geodb': 'GeoDB API',
      'hibrido': 'Híbrido'
    };
    
    const infoElement = document.getElementById('calculo-info');
    if (infoElement) {
      const sistemaTexto = infoSistema[sistemaActual] || 'Local';
      infoElement.textContent = `(Sistema: ${sistemaTexto})`;
    }
    
    console.log(`Cálculo realizado usando: ${infoSistema[sistemaActual] || 'Local'}`);
    console.log('Resultado:', calculo);
  }

  calcularDatosLocal() {
    // Método de fallback usando datos locales mejorado
    const origenText = document.getElementById('ciudadOrigen').value;
    const destinoText = document.getElementById('ciudadDestino').value;
    
    if (!origenText || !destinoText) return null;
    
    // Obtener información de las ciudades
    const origenInfo = this.obtenerInfoCiudad(origenText);
    const destinoInfo = this.obtenerInfoCiudad(destinoText);
    
    // Calcular distancia usando Haversine y aplicar 35% extra
    const distanciaBase = this.calcularDistancia(origenInfo, destinoInfo);
    const distancia = distanciaBase * 1.14; // % aplicar 14% extra
    
    // Calcular precio y duración
    const precio = this.calcularPrecio(distancia);
    const duracion = this.calcularDuracion(distancia);
    
    return {
      distancia: Math.round(distancia),
      precio: Math.round(precio * 100) / 100,
      duracion: duracion,
      sistema: 'Local (Fallback)'
    };
  }

  obtenerInfoCiudad(ciudad) {
    // Esta función debería obtener información de la ciudad desde tus datos
    // Por ahora retornamos datos aproximados para ciudades principales
    const ciudadesInfo = {
      'Lima': { lat: -12.0464, lng: -77.0428 },
      'Arequipa': { lat: -16.4090, lng: -71.5375 },
      'Trujillo': { lat: -8.1116, lng: -79.0297 },
      'Chiclayo': { lat: -6.7714, lng: -79.8374 },
      'Huancayo': { lat: -12.0653, lng: -75.2049 },
      'Cusco': { lat: -13.5319, lng: -71.9675 },
      'Barranca': { lat: -10.7500, lng: -77.7667 },
      'Huacho': { lat: -11.1070, lng: -77.6050 },
      'Huaral': { lat: -11.4950, lng: -77.2050 }
    };
    
    return ciudadesInfo[ciudad] || { lat: -12.0464, lng: -77.0428 }; // Default Lima
  }

  calcularDistancia(origen, destino) {
    // Fórmula de Haversine para calcular distancia entre dos puntos
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(destino.lat - origen.lat);
    const dLng = this.toRad(destino.lng - origen.lng);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(origen.lat)) * Math.cos(this.toRad(destino.lat)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(valor) {
    return valor * Math.PI / 180;
  }

  calcularPrecio(distancia) {
    // Tarifa local: precio por km fijo sin recargo base
    const precioBase = 0; // sin tarifa base
    const precioPorKm = 0.14; // tarifa local en S/ por km
    return precioBase + (distancia * precioPorKm);
  }

  calcularDuracion(distancia) {
    // Velocidad promedio de 60 km/h
    const velocidadPromedio = 60;
    const horas = distancia / velocidadPromedio;
    const horasEnteras = Math.floor(horas);
    const minutos = Math.round((horas - horasEnteras) * 60);
    
    // Retornar en formato HH:MM para el formulario
    return `${horasEnteras.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  }

  actualizarFechaLlegada() {
    const fechaSalida = document.getElementById('fechaSalida').value;
    const horaSalida = document.getElementById('horaSalida').value;
    const duracion = document.getElementById('duracion').value;
    
    if (!fechaSalida || !horaSalida || !duracion) return;
    
    try {
      // Parsear duración en formato HH:MM
      let minutosTotal = 0;
      
      // Formato HH:MM (por ejemplo: "08:30", "12:00")
      if (duracion.includes(':')) {
        const [horas, minutos] = duracion.split(':').map(num => parseInt(num) || 0);
        minutosTotal = (horas * 60) + minutos;
      } else {
        // Formato antiguo por compatibilidad: Xh Ymin o Xmin
        const duracionMatch = duracion.match(/(\d+)h\s*(\d+)?min|(\d+)min/);
        
        if (duracionMatch) {
          if (duracionMatch[1]) { // Formato "Xh Ymin" o "Xh"
            minutosTotal += parseInt(duracionMatch[1]) * 60;
            if (duracionMatch[2]) {
              minutosTotal += parseInt(duracionMatch[2]);
            }
          } else if (duracionMatch[3]) { // Formato "Xmin"
            minutosTotal = parseInt(duracionMatch[3]);
          }
        }
      }
      
      // Verificar que se pudo parsear la duración
      if (minutosTotal <= 0) {
        console.warn('No se pudo parsear la duración:', duracion);
        return;
      }
      
      // Crear fecha de salida
      const fechaHoraSalida = new Date(`${fechaSalida}T${horaSalida}`);
      
      // Añadir duración
      const fechaHoraLlegada = new Date(fechaHoraSalida.getTime() + minutosTotal * 60000);
      
      // Actualizar campos de llegada
      const fechaLlegadaFormatted = fechaHoraLlegada.toISOString().split('T')[0];
      const horaLlegadaFormatted = fechaHoraLlegada.toTimeString().slice(0, 5);
      
      document.getElementById('fechaLlegada').value = fechaLlegadaFormatted;
      document.getElementById('horaLlegada').value = horaLlegadaFormatted;
      
      // Log para depuración
      console.log(`[ADMIN-RUTAS] Cálculo de llegada:`, {
        salida: `${fechaSalida} ${horaSalida}`,
        duracion: duracion,
        minutosTotal: minutosTotal,
        llegada: `${fechaLlegadaFormatted} ${horaLlegadaFormatted}`
      });
      
    } catch (error) {
      console.error('Error calculando fecha de llegada:', error);
      // Limpiar campos en caso de error
      document.getElementById('fechaLlegada').value = '';
      document.getElementById('horaLlegada').value = '';
    }
  }

  async handleSubmitRuta(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const rutaData = Object.fromEntries(formData.entries());
    
    // Validaciones
    if (!this.validarFormularioRuta(rutaData)) {
      return;
    }
    
    // Construir nombres de ruta
    rutaData.origen = `${rutaData.ciudadOrigen}, ${rutaData.provinciaOrigen}`;
    rutaData.destino = `${rutaData.ciudadDestino}, ${rutaData.provinciaDestino}`;
    
    try {
      const url = `${API_BASE_URL}/rutas.php`;
      const method = this.rutaEditando ? 'PUT' : 'POST';
      
      if (this.rutaEditando) {
        rutaData.id = this.rutaEditando;
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rutaData)
      });
      
      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        console.error(`HTTP Error: ${response.status} ${response.statusText}`);
        
        // Intentar obtener mensaje de error del servidor
        let errorMessage = 'Error del servidor';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Si no se puede parsear JSON, usar el texto de respuesta
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch {
            errorMessage = `Error HTTP ${response.status}`;
          }
        }
        
        this.showAlert(errorMessage, 'danger');
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Verificar si la ruta fue movida a concluidas
        if (result.movida_a_concluidas) {
          this.showAlert(
            'Ruta creada pero movida automáticamente a concluidas porque ya venció',
            'warning'
          );
        } else {
          this.showAlert(
            this.rutaEditando ? 'Ruta actualizada exitosamente' : 'Ruta creada exitosamente',
            'success'
          );
        }
        
        this.ocultarFormularioRuta();
        this.cargarRutas();
      } else {
        this.showAlert(result.error || 'Error al guardar la ruta', 'danger');
      }
      
    } catch (error) {
      console.error('Error saving route:', error);
      this.showAlert('Error de conexión al guardar la ruta', 'danger');
    }
  }

  validarFormularioRuta(data) {
    if (!data.regionOrigen || !data.provinciaOrigen || !data.ciudadOrigen) {
      this.showAlert('Por favor selecciona origen completo', 'warning');
      return false;
    }
    
    if (!data.regionDestino || !data.provinciaDestino || !data.ciudadDestino) {
      this.showAlert('Por favor selecciona destino completo', 'warning');
      return false;
    }
    
    if (data.ciudadOrigen === data.ciudadDestino) {
      this.showAlert('El origen y destino no pueden ser iguales', 'warning');
      return false;
    }
    
    if (!data.fechaSalida || !data.horaSalida) {
      this.showAlert('Por favor ingresa fecha y hora de salida', 'warning');
      return false;
    }
    
    if (!data.capacidad || data.capacidad < 1) {
      this.showAlert('La capacidad debe ser mayor a 0', 'warning');
      return false;
    }
    
    return true;
  }

  async cargarRutas() {
    try {
      const response = await fetch(`${API_BASE_URL}/rutas.php`);
      const data = await response.json();
      
      if (data.success) {
        this.renderRutas(data.rutas);
      } else {
        this.showAlert('Error al cargar las rutas', 'danger');
      }
    } catch (error) {
      console.error('Error loading routes:', error);
      this.showAlert('Error de conexión al cargar rutas', 'danger');
    }
  }

  renderRutas(rutas) {
    const tbody = document.getElementById('tablaRutas');
    if (!tbody) return;
    
    if (rutas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" class="text-center py-4">
            <i class="fas fa-route fa-2x text-muted mb-2"></i>
            <p class="text-muted">No hay rutas registradas</p>
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = rutas.map(ruta => `
      <tr>
        <td>${ruta.id}</td>
        <td>
          <strong>${ruta.origen}</strong><br>
          <i class="fas fa-arrow-right text-muted"></i><br>
          <strong>${ruta.destino}</strong>
        </td>
        <td>
          ${this.formatDate(ruta.fecha_salida)}<br>
          <small class="text-muted">${ruta.hora_salida}</small>
        </td>
        <td>S/ ${parseFloat(ruta.precio).toFixed(2)}</td>
        <td>${ruta.duracion}</td>
        <td>${ruta.distancia} km</td>
        <td>${ruta.capacidad}</td>
        <td>
          <span class="badge bg-info">${ruta.reservas_count || 0}</span>
        </td>
        <td>
          <span class="badge bg-${this.getEstadoBadgeClass(ruta.estado)}">
            ${this.getEstadoText(ruta.estado)}
          </span>
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" onclick="window.AdminRutas.editarRuta(${ruta.id})" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-outline-danger" onclick="window.AdminRutas.eliminarRuta(${ruta.id})" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
            <div class="btn-group">
              <button class="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" title="Más opciones">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#" onclick="window.AdminRutas.posponerRuta(${ruta.id})">
                  <i class="fas fa-calendar-plus"></i> Posponer
                </a></li>
                <li><a class="dropdown-item" href="#" onclick="window.AdminRutas.cancelarRuta(${ruta.id})">
                  <i class="fas fa-ban"></i> Cancelar
                </a></li>
              </ul>
            </div>
          </div>
        </td>
      </tr>
    `).join('');
  }

  getEstadoBadgeClass(estado) {
    switch (estado) {
      case 'activo': return 'success';
      case 'inactivo': return 'secondary';
      case 'mantenimiento': return 'warning';
      default: return 'secondary';
    }
  }

  getEstadoText(estado) {
    switch (estado) {
      case 'activo': return 'Activo';
      case 'inactivo': return 'Inactivo';
      case 'mantenimiento': return 'Mantenimiento';
      default: return estado;
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  async editarRuta(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/rutas.php?id=${id}`);
      const data = await response.json();
      
      if (data.success && data.ruta) {
        this.cargarDatosEnFormulario(data.ruta);
        this.rutaEditando = id;
        document.getElementById('form-title').innerHTML = '<i class="fas fa-edit"></i> Editar Ruta';
        document.getElementById('form-ruta-container').style.display = 'block';
        document.getElementById('form-ruta-container').scrollIntoView({ behavior: 'smooth' });
      } else {
        this.showAlert('Error al cargar los datos de la ruta', 'danger');
      }
    } catch (error) {
      console.error('Error loading route data:', error);
      this.showAlert('Error de conexión al cargar la ruta', 'danger');
    }
  }

  cargarDatosEnFormulario(ruta) {
    // Cargar datos básicos
    document.getElementById('regionOrigen').value = ruta.origen_region || '';
    document.getElementById('provinciaOrigen').value = ruta.origen_provincia || '';
    document.getElementById('ciudadOrigen').value = ruta.origen_ciudad || '';
    
    document.getElementById('regionDestino').value = ruta.destino_region || '';
    document.getElementById('provinciaDestino').value = ruta.destino_provincia || '';
    document.getElementById('ciudadDestino').value = ruta.destino_ciudad || '';
    
    // Información del viaje
    document.getElementById('distancia').value = ruta.distancia_km || ruta.distancia || '';
    document.getElementById('precio').value = ruta.precio || '';
    document.getElementById('duracion').value = ruta.duracion || '';
    document.getElementById('capacidad').value = ruta.capacidad_pasajeros || ruta.capacidad || '40';
    
    // Fechas y horarios
    if (ruta.fecha_salida) {
      const fechaSalida = new Date(ruta.fecha_salida);
      document.getElementById('fechaSalida').value = fechaSalida.toISOString().split('T')[0];
      
      // Si hay hora_salida separada, usarla; sino extraer de fecha_salida
      if (ruta.hora_salida) {
        document.getElementById('horaSalida').value = ruta.hora_salida;
      } else {
        document.getElementById('horaSalida').value = fechaSalida.toTimeString().slice(0, 5);
      }
    }
    
    if (ruta.fecha_llegada) {
      const fechaLlegada = new Date(ruta.fecha_llegada);
      document.getElementById('fechaLlegada').value = fechaLlegada.toISOString().split('T')[0];
      
      // Si hay hora_llegada separada, usarla; sino extraer de fecha_llegada
      if (ruta.hora_llegada) {
        document.getElementById('horaLlegada').value = ruta.hora_llegada;
      } else {
        document.getElementById('horaLlegada').value = fechaLlegada.toTimeString().slice(0, 5);
      }
    }
    
    // Estado e imagen
    document.getElementById('estado').value = ruta.estado || 'activo';
    document.getElementById('imagen').value = ruta.imagen || '';
  }

  async eliminarRuta(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta ruta?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/rutas.php?id=${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showAlert('Ruta eliminada exitosamente', 'success');
        this.cargarRutas();
      } else {
        this.showAlert(result.error || 'Error al eliminar la ruta', 'danger');
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      this.showAlert('Error de conexión al eliminar la ruta', 'danger');
    }
  }

  async posponerRuta(id) {
    const nuevaFecha = prompt('Ingresa la nueva fecha de salida (YYYY-MM-DD):');
    if (!nuevaFecha) return;
    
    const nuevaHora = prompt('Ingresa la nueva hora de salida (HH:MM):', '08:00');
    if (!nuevaHora) return;

    try {
      // Primero obtener los datos actuales de la ruta
      const response = await fetch(`${API_BASE_URL}/rutas.php?id=${id}`);
      const data = await response.json();
      
      if (!data.success || !data.ruta) {
        this.showAlert('Error al cargar los datos de la ruta', 'danger');
        return;
      }

      // Actualizar solo las fechas
      const rutaData = {
        ...data.ruta,
        id: id,
        fecha_salida: nuevaFecha,
        hora_salida: nuevaHora,
        // Recalcular fecha de llegada si hay duración
        fecha_llegada: this.calcularFechaLlegada(nuevaFecha, nuevaHora, data.ruta.duracion),
        hora_llegada: this.calcularHoraLlegada(nuevaHora, data.ruta.duracion)
      };

      const updateResponse = await fetch(`${API_BASE_URL}/rutas.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rutaData)
      });

      const result = await updateResponse.json();
      
      if (result.success) {
        this.showAlert('Ruta pospuesta exitosamente', 'success');
        this.cargarRutas();
      } else {
        this.showAlert(result.error || 'Error al posponer la ruta', 'danger');
      }
    } catch (error) {
      console.error('Error postponing route:', error);
      this.showAlert('Error de conexión al posponer la ruta', 'danger');
    }
  }

  async cancelarRuta(id) {
    if (!confirm('¿Estás seguro de que quieres cancelar esta ruta? Se cambiará el estado a inactivo.')) {
      return;
    }
    
    try {
      // Primero obtener los datos actuales de la ruta
      const response = await fetch(`${API_BASE_URL}/rutas.php?id=${id}`);
      const data = await response.json();
      
      if (!data.success || !data.ruta) {
        this.showAlert('Error al cargar los datos de la ruta', 'danger');
        return;
      }

      // Actualizar solo el estado
      const rutaData = {
        ...data.ruta,
        id: id,
        estado: 'inactivo'
      };

      const updateResponse = await fetch(`${API_BASE_URL}/rutas.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rutaData)
      });

      const result = await updateResponse.json();
      
      if (result.success) {
        this.showAlert('Ruta cancelada exitosamente', 'success');
        this.cargarRutas();
      } else {
        this.showAlert(result.error || 'Error al cancelar la ruta', 'danger');
      }
    } catch (error) {
      console.error('Error canceling route:', error);
      this.showAlert('Error de conexión al cancelar la ruta', 'danger');
    }
  }

  calcularFechaLlegada(fechaSalida, horaSalida, duracion) {
    if (!duracion) return fechaSalida;
    
    try {
      const fechaHoraSalida = new Date(`${fechaSalida}T${horaSalida}`);
      let minutosTotal = 0;
      
      // Parsear duración en formato HH:MM
      if (duracion.includes(':')) {
        const [horas, minutos] = duracion.split(':').map(Number);
        minutosTotal = (horas * 60) + minutos;
      } else if (duracion.includes('h')) {
        // Formato como "12h 30min"
        const horasMatch = duracion.match(/(\d+)h/);
        const minutosMatch = duracion.match(/(\d+)min/);
        const horas = horasMatch ? parseInt(horasMatch[1]) : 0;
        const minutos = minutosMatch ? parseInt(minutosMatch[1]) : 0;
        minutosTotal = (horas * 60) + minutos;
      }
      
      const fechaLlegada = new Date(fechaHoraSalida.getTime() + minutosTotal * 60000);
      return fechaLlegada.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error calculando fecha de llegada:', error);
      return fechaSalida;
    }
  }

  calcularHoraLlegada(horaSalida, duracion) {
    if (!duracion) return horaSalida;
    
    try {
      const fechaHoraSalida = new Date(`2000-01-01T${horaSalida}`);
      let minutosTotal = 0;
      
      // Parsear duración en formato HH:MM
      if (duracion.includes(':')) {
        const [horas, minutos] = duracion.split(':').map(Number);
        minutosTotal = (horas * 60) + minutos;
      } else if (duracion.includes('h')) {
        // Formato como "12h 30min"
        const horasMatch = duracion.match(/(\d+)h/);
        const minutosMatch = duracion.match(/(\d+)min/);
        const horas = horasMatch ? parseInt(horasMatch[1]) : 0;
        const minutos = minutosMatch ? parseInt(minutosMatch[1]) : 0;
        minutosTotal = (horas * 60) + minutos;
      }
      
      const fechaLlegada = new Date(fechaHoraSalida.getTime() + minutosTotal * 60000);
      return fechaLlegada.toTimeString().slice(0, 5);
    } catch (error) {
      console.error('Error calculando hora de llegada:', error);
      return horaSalida;
    }
  }

  // === MÉTODOS HELPER PARA MODO MANUAL ===
  
  // Calcular automáticamente la ruta completa
  calcularAutomatico() {
    console.log('[ADMIN-RUTAS] Calculando automáticamente...');
    
    const ciudadOrigen = document.getElementById('ciudadOrigen')?.value;
    const ciudadDestino = document.getElementById('ciudadDestino')?.value;
    
    if (!ciudadOrigen || !ciudadDestino) {
      this.showAlert('Seleccione origen y destino antes de calcular', 'warning');
      return;
    }
    
    if (ciudadOrigen === ciudadDestino) {
      this.showAlert('El origen y destino no pueden ser iguales', 'warning');
      return;
    }
    
    // Forzar recálculo
    this.actualizarCalculos();
  }
  
  // Calcular precio basado en la distancia actual
  calcularPrecioPorDistancia() {
    console.log('[ADMIN-RUTAS] Calculando precio por distancia...');
    
    const distanciaField = document.getElementById('distancia');
    const precioField = document.getElementById('precio');
    
    if (!distanciaField?.value) {
      this.showAlert('Ingrese primero la distancia', 'warning');
      distanciaField?.focus();
      return;
    }
    
    const distancia = parseFloat(distanciaField.value);
    if (distancia <= 0) {
      this.showAlert('La distancia debe ser mayor a 0', 'warning');
      return;
    }
    
    const precio = this.calcularPrecio(distancia);
    precioField.value = Math.round(precio * 100) / 100;
    
    this.showAlert(`Precio calculado: S/ ${precio.toFixed(2)} (${distancia} km)`, 'success');
  }
  
  // Calcular duración basada en la distancia actual
  calcularDuracionPorDistancia() {
    console.log('[ADMIN-RUTAS] Calculando duración por distancia...');
    
    const distanciaField = document.getElementById('distancia');
    const duracionField = document.getElementById('duracion');
    
    if (!distanciaField?.value) {
      this.showAlert('Ingrese primero la distancia', 'warning');
      distanciaField?.focus();
      return;
    }
    
    const distancia = parseFloat(distanciaField.value);
    if (distancia <= 0) {
      this.showAlert('La distancia debe ser mayor a 0', 'warning');
      return;
    }
    
    const duracion = this.calcularDuracion(distancia);
    duracionField.value = duracion;
    
    this.showAlert(`Duración calculada: ${duracion} (${distancia} km)`, 'success');
  }
  
  // Mostrar modal con tabla de precios de referencia
  mostrarPreciosReferencia() {
    console.log('[ADMIN-RUTAS] Mostrando tabla de precios de referencia...');
    
    const modal = `
      <div class="modal fade" id="modalPreciosReferencia" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-table"></i> Tabla de Precios de Referencia
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <h6 class="text-primary mb-3">Rutas Principales del Perú</h6>
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead class="table-dark">
                    <tr>
                      <th>Origen</th>
                      <th>Destino</th>
                      <th>Distancia (km)</th>
                      <th>Duración</th>
                      <th>Precio Sugerido (S/)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td>Lima</td><td>Arequipa</td><td>1,009</td><td>15:30</td><td>120-150</td></tr>
                    <tr><td>Lima</td><td>Trujillo</td><td>558</td><td>8:30</td><td>65-85</td></tr>
                    <tr><td>Lima</td><td>Chiclayo</td><td>770</td><td>12:00</td><td>85-110</td></tr>
                    <tr><td>Lima</td><td>Cusco</td><td>1,131</td><td>17:00</td><td>130-170</td></tr>
                    <tr><td>Lima</td><td>Huancayo</td><td>305</td><td>6:30</td><td>35-55</td></tr>
                    <tr><td>Lima</td><td>Ica</td><td>303</td><td>4:30</td><td>35-50</td></tr>
                    <tr><td>Lima</td><td>Huacho</td><td>148</td><td>2:30</td><td>20-30</td></tr>
                    <tr><td>Lima</td><td>Barranca</td><td>193</td><td>3:00</td><td>25-35</td></tr>
                    <tr><td>Lima</td><td>Huaral</td><td>81</td><td>1:30</td><td>15-25</td></tr>
                    <tr><td>Lima</td><td>Lambayeque</td><td>557</td><td>8:55</td><td>70-90</td></tr>
                    <tr><td>Arequipa</td><td>Cusco</td><td>320</td><td>6:00</td><td>40-60</td></tr>
                    <tr><td>Trujillo</td><td>Chiclayo</td><td>209</td><td>3:30</td><td>25-40</td></tr>
                  </tbody>
                </table>
              </div>
              
              <div class="mt-4">
                <h6 class="text-info">Factores de Cálculo</h6>
                <div class="row">
                  <div class="col-md-6">
                    <h7><strong>Precio por Kilómetro:</strong></h7>
                    <ul class="small">
                      <li>Rutas cortas (&lt;200km): S/ 0.15-0.20 por km</li>
                      <li>Rutas medias (200-600km): S/ 0.10-0.15 por km</li>
                      <li>Rutas largas (&gt;600km): S/ 0.08-0.12 por km</li>
                    </ul>
                  </div>
                  <div class="col-md-6">
                    <h7><strong>Velocidades Promedio:</strong></h7>
                    <ul class="small">
                      <li>Carretera costa: 70-90 km/h</li>
                      <li>Carretera sierra: 40-60 km/h</li>
                      <li>Carretera selva: 50-70 km/h</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Remover modal existente si lo hay
    const modalExistente = document.getElementById('modalPreciosReferencia');
    if (modalExistente) modalExistente.remove();
    
    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Mostrar modal
    const modalInstance = new bootstrap.Modal(document.getElementById('modalPreciosReferencia'));
    modalInstance.show();
  }
  
  // Configurar modo de edición manual/automático
  configurarModoEdicion() {
    const modoManualSwitch = document.getElementById('modoManual');
    const distanciaField = document.getElementById('distancia');
    const precioField = document.getElementById('precio');
    const duracionField = document.getElementById('duracion');
    
    if (!modoManualSwitch) return;
    
    // Función para alternar modo - usando función regular para mantener el contexto this
    const alternarModo = function() {
      const esManual = modoManualSwitch.checked;
      const campos = [distanciaField, precioField, duracionField];
      
      // Cambiar propiedades de solo lectura
      campos.forEach(field => {
        if (field) {
          field.readOnly = !esManual;
        }
      });
      
      // Cambiar apariencia visual con clases CSS específicas
      campos.forEach(field => {
        if (field) {
          // Remover todas las clases de modo
          field.classList.remove(
            'form-control-plaintext', 
            'form-control',
            'manual-editable',
            'auto-readonly',
            'modo-transition'
          );
          
          // Agregar clases según el modo
          if (esManual) {
            field.classList.add('form-control', 'manual-editable', 'modo-transition');
            field.style.cursor = 'text';
            field.title = 'Editable manualmente - Puedes cambiar este valor';
          } else {
            field.classList.add('form-control-plaintext', 'auto-readonly', 'modo-transition');
            field.style.cursor = 'not-allowed';
            field.title = 'Solo lectura - Valor calculado automáticamente';
          }
        }
      });
      
      // Cambiar el contenedor principal para animaciones
      const contenedorPrincipal = document.querySelector('.row:has(#distancia)');
      if (contenedorPrincipal) {
        contenedorPrincipal.classList.remove('modo-manual', 'modo-automatico');
        contenedorPrincipal.classList.add(esManual ? 'modo-manual' : 'modo-automatico');
      }
      
      // Mostrar/ocultar ayudas con animación
      const ayudas = document.getElementById('ayudas-calculo');
      if (ayudas) {
        if (esManual) {
          ayudas.classList.remove('hidden');
          ayudas.style.display = 'block';
          // Pequeño delay para la animación
          setTimeout(() => ayudas.classList.add('fade-in'), 50);
        } else {
          ayudas.classList.add('hidden');
          setTimeout(() => ayudas.style.display = 'none', 300);
        }
      }
      
      // Actualizar indicador visual del switch
      const switchLabel = modoManualSwitch.nextElementSibling;
      if (switchLabel) {
        switchLabel.style.color = esManual ? 'var(--success-color)' : 'var(--secondary-color)';
        switchLabel.style.fontWeight = esManual ? '600' : '500';
      }
      
      // Mostrar mensaje informativo
      this.showAlert(
        esManual 
          ? 'Modo manual activado: Puedes editar distancia, precio y duración libremente' 
          : 'Modo automático activado: Los valores se calcularán automáticamente',
        esManual ? 'success' : 'info'
      );
      
      console.log(`[ADMIN-RUTAS] Modo cambiado a: ${esManual ? 'Manual' : 'Automático'}`);
    }.bind(this);
    
    // Configurar evento
    modoManualSwitch.addEventListener('change', alternarModo);
    
    // Aplicar estado inicial
    alternarModo();
  }

  // === VALIDACIONES EN TIEMPO REAL ===
  
  // Configurar validaciones en tiempo real
  configurarValidaciones() {
    const duracionField = document.getElementById('duracion');
    const distanciaField = document.getElementById('distancia');
    const precioField = document.getElementById('precio');
    
    // Validar formato de duración con feedback visual mejorado
    if (duracionField) {
      duracionField.addEventListener('blur', () => {
        const valor = duracionField.value.trim();
        if (valor && !this.validarFormatoDuracion(valor)) {
          this.mostrarErrorCampo(duracionField, 'Formato inválido. Use HH:MM (ej: 08:30)');
        } else if (valor) {
          this.mostrarExitoCampo(duracionField, 'Formato válido');
          // Actualizar fecha de llegada cuando la duración es válida
          this.actualizarFechaLlegada();
        } else {
          this.limpiarValidacionCampo(duracionField);
        }
      });
      
      // Actualizar fecha de llegada cuando cambie la duración
      duracionField.addEventListener('input', () => {
        // Debounce para evitar cálculos excesivos
        clearTimeout(this.duracionTimeout);
        this.duracionTimeout = setTimeout(() => {
          this.actualizarFechaLlegada();
        }, 500);
      });
      
      // Auto-formatear duración mientras se escribe
      duracionField.addEventListener('input', (e) => {
        let valor = e.target.value.replace(/[^0-9:]/g, '');
        
        // Auto-agregar los dos puntos
        if (valor.length === 2 && !valor.includes(':')) {
          valor = valor + ':';
        }
        
        // Limitar a 5 caracteres (HH:MM)
        if (valor.length > 5) {
          valor = valor.substring(0, 5);
        }
        
        e.target.value = valor;
        
        // Validación en tiempo real
        if (valor.length === 5) {
          if (this.validarFormatoDuracion(valor)) {
            this.mostrarExitoCampo(e.target, '');
          } else {
            this.mostrarErrorCampo(e.target, '');
          }
        } else {
          this.limpiarValidacionCampo(e.target);
        }
      });
      
      // Limpiar validación al hacer focus
      duracionField.addEventListener('focus', () => {
        this.limpiarValidacionCampo(duracionField);
      });
    }
    
    // Validar distancia con feedback visual
    if (distanciaField) {
      distanciaField.addEventListener('blur', () => {
        const valor = parseFloat(distanciaField.value);
        if (distanciaField.value && (isNaN(valor) || valor < 1 || valor > 5000)) {
          this.mostrarErrorCampo(distanciaField, 'Debe estar entre 1 y 5000 km');
        } else if (distanciaField.value) {
          this.mostrarExitoCampo(distanciaField, `${valor} km es válido`);
        } else {
          this.limpiarValidacionCampo(distanciaField);
        }
      });
      
      distanciaField.addEventListener('focus', () => {
        this.limpiarValidacionCampo(distanciaField);
      });
    }
    
    // Validar precio con feedback visual
    if (precioField) {
      precioField.addEventListener('blur', () => {
        const valor = parseFloat(precioField.value);
        if (precioField.value && (isNaN(valor) || valor < 10 || valor > 500)) {
          this.mostrarErrorCampo(precioField, 'Debe estar entre S/ 10 y S/ 500');
        } else if (precioField.value) {
          this.mostrarExitoCampo(precioField, `S/ ${valor.toFixed(2)} es válido`);
        } else {
          this.limpiarValidacionCampo(precioField);
        }
      });
      
      precioField.addEventListener('focus', () => {
        this.limpiarValidacionCampo(precioField);
      });
    }
  }
  
  // Validar formato de duración HH:MM
  validarFormatoDuracion(duracion) {
    const regex = /^([0-9]{1,2}):([0-5][0-9])$/;
    const match = duracion.match(regex);
    
    if (!match) return false;
    
    const horas = parseInt(match[1]);
    const minutos = parseInt(match[2]);
    
    // Validar rangos razonables
    return horas >= 0 && horas <= 48 && minutos >= 0 && minutos <= 59;
  }
  
  // Funciones auxiliares para validación visual
  mostrarErrorCampo(campo, mensaje) {
    campo.classList.remove('is-valid');
    campo.classList.add('is-invalid');
    
    // Remover feedback anterior
    this.removerFeedback(campo);
    
    if (mensaje) {
      const feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      feedback.textContent = mensaje;
      campo.parentNode.appendChild(feedback);
    }
  }
  
  mostrarExitoCampo(campo, mensaje) {
    campo.classList.remove('is-invalid');
    campo.classList.add('is-valid');
    
    // Remover feedback anterior
    this.removerFeedback(campo);
    
    if (mensaje) {
      const feedback = document.createElement('div');
      feedback.className = 'valid-feedback';
      feedback.textContent = mensaje;
      campo.parentNode.appendChild(feedback);
    }
  }
  
  limpiarValidacionCampo(campo) {
    campo.classList.remove('is-valid', 'is-invalid');
    this.removerFeedback(campo);
  }
  
  removerFeedback(campo) {
    const feedbacks = campo.parentNode.querySelectorAll('.valid-feedback, .invalid-feedback');
    feedbacks.forEach(feedback => feedback.remove());
  }

  // === MÉTODO PARA MOSTRAR ALERTAS ===
  
  // Función para mostrar alertas en el panel admin
  showAlert(message, type = 'info') {
    // Crear o usar contenedor de alertas
    let alertContainer = document.getElementById('alert-container-rutas');
    if (!alertContainer) {
      alertContainer = document.createElement('div');
      alertContainer.id = 'alert-container-rutas';
      alertContainer.className = 'position-fixed top-0 end-0 p-3';
      alertContainer.style.zIndex = '9999';
      document.body.appendChild(alertContainer);
    }
    
    // Crear alerta
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-circle' : 'info-circle'}"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alertElement);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
      if (alertElement.parentNode) {
        alertElement.remove();
      }
    }, 5000);
  }

  // === SISTEMA DE IMÁGENES AUTOMÁTICAS ===
  configurarSistemaImagenes() {
    // Implementación básica para evitar errores
    // Puedes personalizar la lógica según tus necesidades
    console.log('[ADMIN-RUTAS] configurarSistemaImagenes ejecutado');
  }

  toggleModoImagen() {
    // Implementación básica
    console.log('[ADMIN-RUTAS] toggleModoImagen ejecutado');
  }

  // Actualiza el valor del input de imagen automática según la ciudad destino
  actualizarImagenAutomatica() {
    const checkbox = document.querySelector('input[type="checkbox"]#imagenAutomatica');
    const ciudad = document.getElementById('ciudadDestino').value;
    if (checkbox && checkbox.checked && ciudad) {
      const inputAuto = document.querySelector('#imagen-automatica-container input[type="text"]');
      if (inputAuto) {
        inputAuto.value = `${ciudad}.jpg`;
      }
    }
  }
}

// Crear instancia global
window.AdminRutas = new AdminRutas();

// Hacer las funciones accesibles globalmente
window.mostrarFormularioRuta = () => window.AdminRutas.mostrarFormularioRuta();
window.ocultarFormularioRuta = () => window.AdminRutas.ocultarFormularioRuta();

// Exportar funciones de ubicaciones para uso global
window.cargarProvinciasAdmin = (selectId, region) => window.AdminRutas.cargarProvincias(selectId, region);
window.cargarCiudadesAdmin = (selectId, region, provincia) => window.AdminRutas.cargarCiudades(selectId, region, provincia);

// Funciones globales para el modo manual
window.calcularAutomatico = () => {
  if (window.AdminRutas) {
    window.AdminRutas.calcularAutomatico();
  } else {
    console.error('AdminRutas no disponible');
  }
};

window.calcularPrecioPorDistancia = () => {
  if (window.AdminRutas) {
    window.AdminRutas.calcularPrecioPorDistancia();
  } else {
    console.error('AdminRutas no disponible');
  }
};

window.calcularDuracionPorDistancia = () => {
  if (window.AdminRutas) {
    window.AdminRutas.calcularDuracionPorDistancia();
  } else {
    console.error('AdminRutas no disponible');
  }
};

window.mostrarPreciosReferencia = () => {
  if (window.AdminRutas) {
    window.AdminRutas.mostrarPreciosReferencia();
  } else {
    console.error('AdminRutas no disponible');
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.adminRutas = window.AdminRutas; // For backward compatibility
  
  // Log para verificar que todo está disponible
  console.log('[ADMIN-RUTAS] AdminRutas inicializado:', typeof window.AdminRutas);
  console.log('[ADMIN-RUTAS] mostrarFormularioRuta:', typeof window.mostrarFormularioRuta);
  console.log('[ADMIN-RUTAS] cargarProvinciasAdmin:', typeof window.cargarProvinciasAdmin);
  console.log('[ADMIN-RUTAS] cargarCiudadesAdmin:', typeof window.cargarCiudadesAdmin);
});
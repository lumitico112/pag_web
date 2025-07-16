// Mostrar rutas dinámicas en la página de compra

let todasLasRutas = []; // Variable global para almacenar todas las rutas

document.addEventListener('DOMContentLoaded', function() {
  cargarRutasDinamicasComprar();
  cargarInformacionDinamica();
  cargarCiudadesDisponibles();
  inicializarNavegacionRutasComprar();
  
  // Establecer fecha mínima para el input de fecha
  const fechaInput = document.getElementById('fecha');
  if (fechaInput) {
    const hoy = new Date();
    const fechaMinima = hoy.toISOString().split('T')[0];
    fechaInput.setAttribute('min', fechaMinima);
  }
});

async function cargarCiudadesDisponibles() {
  try {
    const response = await fetch(`http://localhost:8000/backend_php/api/rutas.php?v=${new Date().getTime()}`);
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    
    const data = await response.json();
    let rutas = [];
    if (data.success && Array.isArray(data.rutas)) {
      rutas = data.rutas;
    } else if (Array.isArray(data)) {
      rutas = data;
    }
    
    // Extraer ciudades únicas
    const origenes = [...new Set(rutas.map(ruta => ruta.origen).filter(Boolean))];
    const destinos = [...new Set(rutas.map(ruta => ruta.destino).filter(Boolean))];
    
    // Poblar select de origen
    const selectOrigen = document.getElementById('origen');
    origenes.forEach(origen => {
      const option = document.createElement('option');
      option.value = origen;
      option.textContent = origen;
      selectOrigen.appendChild(option);
    });
    
    // Poblar select de destino
    const selectDestino = document.getElementById('destino');
    destinos.forEach(destino => {
      const option = document.createElement('option');
      option.value = destino;
      option.textContent = destino;
      selectDestino.appendChild(option);
    });
    
  } catch (error) {
    console.error('Error cargando ciudades:', error);
  }
}

function buscarRutas() {
  const origen = document.getElementById('origen').value;
  const destino = document.getElementById('destino').value;
  const fecha = document.getElementById('fecha').value;
  
  let rutasFiltradas = todasLasRutas;
  
  if (origen) {
    rutasFiltradas = rutasFiltradas.filter(ruta => 
      ruta.origen && ruta.origen.toLowerCase().includes(origen.toLowerCase())
    );
  }
  
  if (destino) {
    rutasFiltradas = rutasFiltradas.filter(ruta => 
      ruta.destino && ruta.destino.toLowerCase().includes(destino.toLowerCase())
    );
  }
  
  if (fecha) {
    rutasFiltradas = rutasFiltradas.filter(ruta => {
      if (!ruta.fecha_salida) return true; // Incluir rutas sin fecha específica
      const fechaRuta = new Date(ruta.fecha_salida).toISOString().split('T')[0];
      return fechaRuta === fecha;
    });
  }
  
  mostrarRutas(rutasFiltradas);
}

function limpiarBusqueda() {
  document.getElementById('origen').value = '';
  document.getElementById('destino').value = '';
  document.getElementById('fecha').value = '';
  mostrarRutas(todasLasRutas);
}

function mostrarRutas(rutas) {
  const contenedor = document.getElementById('rutas-dinamicas');
  
  if (rutas.length === 0) {
    contenedor.innerHTML = `
      <div class="text-center p-5">
        <div class="alert alert-info">
          <i class="fas fa-info-circle fa-2x mb-3"></i>
          <h5>No se encontraron rutas</h5>
          <p>No hay rutas disponibles con los criterios de búsqueda seleccionados.</p>
          <button class="btn btn-outline-primary" onclick="limpiarBusqueda()">
            <i class="fas fa-eraser"></i> Limpiar búsqueda
          </button>
        </div>
      </div>
    `;
    // Ocultar botones de navegación
    document.getElementById('rutasPrev').style.display = 'none';
    document.getElementById('rutasNext').style.display = 'none';
    document.getElementById('rutasIndicators').style.display = 'none';
    return;
  }
  
  // Actualizar datos de rutas para navegación circular
  if (window.actualizarRutasDataComprar) {
    window.actualizarRutasDataComprar(rutas);
  }
}

async function cargarRutasDinamicasComprar() {
  const contenedor = document.getElementById('rutas-dinamicas');
  if (!contenedor) return;

  contenedor.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div><p class="mt-2">Cargando rutas disponibles...</p></div>';

  try {
    const response = await fetch(`http://localhost:8000/backend_php/api/rutas.php?v=${new Date().getTime()}`);
    if (!response.ok) {
      throw new Error(`Error en la respuesta: ${response.status}`);
    }
    const data = await response.json();

    // Verificar si la respuesta tiene el formato esperado
    let rutas = [];
    if (data.success && Array.isArray(data.rutas)) {
      rutas = data.rutas;
    } else if (Array.isArray(data)) {
      rutas = data;
    }

    if (rutas.length === 0) {
      contenedor.innerHTML = `
        <div class="text-center p-5">
          <div class="alert alert-info">
            <i class="fas fa-info-circle fa-2x mb-3"></i>
            <h5>No hay rutas disponibles</h5>
            <p>Las rutas serán gestionadas por el administrador. Pronto tendremos nuevas opciones de viaje.</p>
          </div>
        </div>
      `;
      // Ocultar botones de navegación
      document.getElementById('rutasPrev').style.display = 'none';
      document.getElementById('rutasNext').style.display = 'none';
      document.getElementById('rutasIndicators').style.display = 'none';
      return;
    }

    // Filtrar solo rutas activas y almacenar en variable global
    todasLasRutas = rutas.filter(ruta => 
      ruta.estado === 'activo' || !ruta.estado
    );

    if (todasLasRutas.length === 0) {
      contenedor.innerHTML = `
        <div class="text-center p-5">
          <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
            <h5>No hay viajes programados</h5>
            <p>Actualmente no hay rutas disponibles para las próximas fechas.</p>
          </div>
        </div>
      `;
      // Ocultar botones de navegación
      document.getElementById('rutasPrev').style.display = 'none';
      document.getElementById('rutasNext').style.display = 'none';
      document.getElementById('rutasIndicators').style.display = 'none';
      return;
    }

    // Usar el sistema de navegación circular
    console.log('Cargando rutas en sistema de navegación:', todasLasRutas.length);
    if (window.actualizarRutasDataComprar) {
      window.actualizarRutasDataComprar(todasLasRutas);
    } else {
      console.log('La función actualizarRutasDataComprar no está disponible');
    }

  } catch (error) {
    contenedor.innerHTML = `
      <div class="text-center p-5">
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle fa-2x mb-3"></i>
          <h5>Error al cargar rutas</h5>
          <p>No se pudieron cargar las rutas disponibles. Inténtalo más tarde.</p>
          <button class="btn btn-outline-danger btn-sm" onclick="cargarRutasDinamicasComprar()">
            <i class="fas fa-redo"></i> Reintentar
          </button>
        </div>
      </div>
    `;
    // Ocultar botones de navegación
    document.getElementById('rutasPrev').style.display = 'none';
    document.getElementById('rutasNext').style.display = 'none';
    document.getElementById('rutasIndicators').style.display = 'none';
    console.error('Error cargando rutas:', error);
  }
}

function crearTarjetaRutaComprar(ruta) {
  // Usar imágenes por defecto o específicas del servidor
  const imgSrc = `../img/rutas/${obtenerImagenRuta(ruta.origen, ruta.destino)}`;
  
  const fechaSalida = ruta.fecha_salida ? new Date(ruta.fecha_salida).toLocaleDateString('es-ES') : 'Por confirmar';
  const horaSalida = ruta.hora_salida || 'Por confirmar';
  const disponibles = ruta.disponibles || ruta.capacidad_pasajeros || 0;
  const capacidad = ruta.capacidad_pasajeros || 40;
  
  const porcentajeOcupacion = capacidad > 0 ? ((capacidad - disponibles) / capacidad) * 100 : 0;
  let estadoCapacidad = '';
  let colorEstado = 'success';
  
  if (disponibles === 0) {
    estadoCapacidad = 'Agotado';
    colorEstado = 'danger';
  } else if (disponibles <= 5) {
    estadoCapacidad = 'Últimos asientos';
    colorEstado = 'warning';
  } else {
    estadoCapacidad = 'Disponible';
    colorEstado = 'success';
  }
  
  return `
    <div class="ruta-card">
      <div class="card route-card h-100">
        <div class="position-relative">
          <img src="${imgSrc}" class="card-img-top" alt="Ruta ${ruta.origen} a ${ruta.destino}" 
               onerror="this.src='../img/bus.jpg'" style="height: 200px; object-fit: cover;">
          <div class="position-absolute top-0 end-0 m-2">
            <span class="badge bg-${colorEstado} fs-6">${estadoCapacidad}</span>
          </div>
          <div class="position-absolute bottom-0 start-0 m-2">
            <span class="badge bg-primary fs-5">S/ ${parseFloat(ruta.precio).toFixed(2)}</span>
          </div>
        </div>
        <div class="card-body d-flex flex-column">
          <h5 class="card-title text-primary mb-3">
            <i class="fas fa-route"></i> ${ruta.origen} → ${ruta.destino}
          </h5>
          
          <div class="mb-3 flex-grow-1">
            <div class="row text-center">
              <div class="col-6">
                <small class="text-muted">Fecha</small>
                <div class="fw-bold">${fechaSalida}</div>
              </div>
              <div class="col-6">
                <small class="text-muted">Hora</small>
                <div class="fw-bold">${horaSalida}</div>
              </div>
            </div>
            
            ${ruta.duracion ? `
              <div class="text-center mt-2">
                <small class="text-muted">Duración estimada</small>
                <div><i class="fas fa-clock text-warning"></i> ${ruta.duracion}</div>
              </div>
            ` : ''}
            
            ${ruta.distancia_km ? `
              <div class="text-center mt-2">
                <small class="text-muted">Distancia</small>
                <div><i class="fas fa-road text-info"></i> ${ruta.distancia_km} km</div>
              </div>
            ` : ''}
            
            ${ruta.descripcion ? `
              <div class="text-center mt-2">
                <small class="text-muted">${ruta.descripcion}</small>
              </div>
            ` : ''}
          </div>
          
          <div class="progress mb-3" style="height: 8px;">
            <div class="progress-bar bg-${colorEstado}" role="progressbar" 
                 style="width: ${porcentajeOcupacion}%" 
                 aria-valuenow="${porcentajeOcupacion}" 
                 aria-valuemin="0" 
                 aria-valuemax="100">
            </div>
          </div>
          
          <div class="text-center mb-3">
            <small class="text-muted">${disponibles} de ${capacidad} asientos disponibles</small>
          </div>
          
          <div class="mt-auto">
            ${disponibles > 0 ? `
              <a href="reserva_5.html?ruta=${ruta.id}" class="btn btn-primary w-100">
                <i class="fas fa-ticket-alt"></i> Reservar Ahora
              </a>
            ` : `
              <button class="btn btn-secondary w-100" disabled>
                <i class="fas fa-times"></i> Sin Disponibilidad
              </button>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}

function obtenerImagenRuta(origen, destino) {
  // Mapear ciudades a imágenes disponibles
  const mapaCiudades = {
    'Lima': 'Lima.jpg',
    'Arequipa': 'Lima.jpg', // Usar Lima como predeterminada
    'Trujillo': 'Trujillo.jpg',
    'Chiclayo': 'Lima.jpg',
    'Huacho': 'Huacho.jpg',
    'Barranca': 'Barranca.jpg',
    'Huaral': 'Huaral.jpg',
    'Huaura': 'Huaura.jpg'
  };
  
  // Buscar imagen para origen o destino
  const ciudadOrigen = Object.keys(mapaCiudades).find(ciudad => 
    origen && origen.toLowerCase().includes(ciudad.toLowerCase())
  );
  const ciudadDestino = Object.keys(mapaCiudades).find(ciudad => 
    destino && destino.toLowerCase().includes(ciudad.toLowerCase())
  );
  
  return mapaCiudades[ciudadOrigen] || mapaCiudades[ciudadDestino] || 'Lima.jpg';
}

function iniciarCompra(rutaId) {
  // Verificar si el usuario está logueado
  if (!auth.isAuthenticated()) {
    alert('Debes iniciar sesión para comprar pasajes');
    window.location.href = 'login.html';
    return;
  }
  
  // Redirigir a la página de reserva
  window.location.href = `reserva_5.html?ruta_id=${rutaId}`;
}

async function cargarInformacionDinamica() {
  const contenedor = document.getElementById('info-dinamica');
  if (!contenedor) return;

  // Cargar información dinámica de beneficios
  contenedor.innerHTML = `
    <div class="row">
      <div class="col-12">
        <h3 class="text-center mb-5">
          <i class="fas fa-star text-warning"></i>
          Por qué elegir UTPTRAVEL
        </h3>
      </div>
    </div>
    <div class="row g-4">
      <div class="col-md-3">
        <div class="text-center">
          <i class="fas fa-shield-alt fa-3x text-primary mb-3"></i>
          <h5>Viajes Seguros</h5>
          <p>Conductores experimentados y buses en perfecto estado</p>
        </div>
      </div>
      <div class="col-md-3">
        <div class="text-center">
          <i class="fas fa-clock fa-3x text-success mb-3"></i>
          <h5>Puntualidad</h5>
          <p>Respetamos tus horarios y llegamos a tiempo</p>
        </div>
      </div>
      <div class="col-md-3">
        <div class="text-center">
          <i class="fas fa-dollar-sign fa-3x text-warning mb-3"></i>
          <h5>Precios Justos</h5>
          <p>Tarifas competitivas sin comprometer la calidad</p>
        </div>
      </div>
      <div class="col-md-3">
        <div class="text-center">
          <i class="fas fa-headset fa-3x text-info mb-3"></i>
          <h5>Atención 24/7</h5>
          <p>Soporte al cliente en todo momento</p>
        </div>
      </div>
    </div>
  `;
}

// Variables para navegación circular en comprar.html
let rutasDataComprar = [];
let currentIndexComprar = 0;
let rutasPerPageComprar = 4; // Mostrar 4 rutas por página en comprar

// Función para navegación circular de rutas en comprar
function inicializarNavegacionRutasComprar() {
  const prevBtn = document.getElementById('rutasPrev');
  const nextBtn = document.getElementById('rutasNext');
  const contenedor = document.getElementById('rutas-dinamicas');
  
  if (!prevBtn || !nextBtn || !contenedor) return;
  
  // Ajustar rutas por página según el tamaño de pantalla
  const updateRutasPerPageComprar = () => {
    if (window.innerWidth <= 768) {
      rutasPerPageComprar = 1;
    } else if (window.innerWidth <= 1024) {
      rutasPerPageComprar = 2;
    } else if (window.innerWidth <= 1400) {
      rutasPerPageComprar = 3;
    } else {
      rutasPerPageComprar = 4;
    }
    crearIndicadoresComprar();
    mostrarRutasActualesComprar();
  };
  
  // Mostrar rutas actuales basado en el índice
  const mostrarRutasActualesComprar = () => {
    if (rutasDataComprar.length === 0) return;
    
    contenedor.innerHTML = '';
    
    // Mostrar rutas de forma circular
    for (let i = 0; i < rutasPerPageComprar; i++) {
      const rutaIndex = (currentIndexComprar + i) % rutasDataComprar.length;
      const ruta = rutasDataComprar[rutaIndex];
      const tarjetaRuta = crearTarjetaRutaComprar(ruta);
      contenedor.innerHTML += tarjetaRuta;
    }
    
    // Actualizar estado de botones e indicadores
    actualizarEstadoBotonesComprar();
  };
  
  // Actualizar estado de botones
  const actualizarEstadoBotonesComprar = () => {
    if (rutasDataComprar.length <= rutasPerPageComprar) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'block';
      nextBtn.style.display = 'block';
    }
  };
  
  // Crear indicadores de página
  const crearIndicadoresComprar = () => {
    const indicatorsContainer = document.getElementById('rutasIndicators');
    if (!indicatorsContainer) return;
    
    indicatorsContainer.innerHTML = '';
    
    if (rutasDataComprar.length <= rutasPerPageComprar) {
      indicatorsContainer.style.display = 'none';
      return;
    }
    
    indicatorsContainer.style.display = 'flex';
    
    const totalPages = Math.ceil(rutasDataComprar.length / rutasPerPageComprar);
    for (let i = 0; i < totalPages; i++) {
      const indicator = document.createElement('div');
      indicator.className = 'rutas-indicator';
      indicator.addEventListener('click', () => {
        currentIndexComprar = i * rutasPerPageComprar;
        if (currentIndexComprar >= rutasDataComprar.length) {
          currentIndexComprar = rutasDataComprar.length - rutasPerPageComprar;
        }
        mostrarRutasActualesComprar();
      });
      indicatorsContainer.appendChild(indicator);
    }
    
    // Actualizar indicadores activos
    const currentPage = Math.floor(currentIndexComprar / rutasPerPageComprar);
    const indicators = document.querySelectorAll('.rutas-indicator');
    indicators.forEach((indicator, index) => {
      if (index === currentPage) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });
  };
  
  // Navegar a la anterior
  prevBtn.addEventListener('click', () => {
    if (rutasDataComprar.length > 0) {
      currentIndexComprar = (currentIndexComprar - 1 + rutasDataComprar.length) % rutasDataComprar.length;
      mostrarRutasActualesComprar();
    }
  });
  
  // Navegar a la siguiente
  nextBtn.addEventListener('click', () => {
    if (rutasDataComprar.length > 0) {
      currentIndexComprar = (currentIndexComprar + 1) % rutasDataComprar.length;
      mostrarRutasActualesComprar();
    }
  });
  
  // Navegación con teclado
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      prevBtn.click();
    } else if (e.key === 'ArrowRight') {
      nextBtn.click();
    }
  });
  
  // Responsive
  window.addEventListener('resize', updateRutasPerPageComprar);
  updateRutasPerPageComprar();
  
  // Exponer funciones para uso externo
  window.mostrarRutasActualesComprar = mostrarRutasActualesComprar;
  window.actualizarRutasDataComprar = (data) => {
    rutasDataComprar = data;
    currentIndexComprar = 0;
    crearIndicadoresComprar();
    mostrarRutasActualesComprar();
  };
}

// Si en el futuro se requiere actualizar datos de usuario tras compra:
// if (window.auth && typeof auth.setUserData === 'function') {
//     auth.setUserData({ /* datos actualizados */ });
// }

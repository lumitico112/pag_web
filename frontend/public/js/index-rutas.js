// Mostrar rutas dinámicas en el index

document.addEventListener('DOMContentLoaded', cargarRutasDinamicas);

async function cargarRutasDinamicas() {
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
      return;
    }
      contenedor.innerHTML = '';
    
    // Filtrar solo rutas activas y con fechas futuras o sin fecha específica
    const rutasActivas = rutas.filter(ruta => 
      ruta.estado === 'activo' || !ruta.estado
    );

    if (rutasActivas.length === 0) {
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
      return;
    }
    
    // Mostrar solo las 3 rutas más importantes (limitado para el index)
    const rutasParaIndex = rutasActivas.slice(0, 6); // Aumentamos a 6 para tener más variedad
    
    // Preparar datos para navegación circular
    const rutasConImagenes = [];
    for (const ruta of rutasParaIndex) {
      const imagenInfo = await obtenerImagenRuta(ruta.origen, ruta.destino);
      rutasConImagenes.push({
        ruta: ruta,
        imagen: imagenInfo
      });
    }
    
    // Actualizar datos de rutas para navegación
    if (window.actualizarRutasData) {
      window.actualizarRutasData(rutasConImagenes);
    }
    
    // Agregar enlace para ver todas las rutas
    if (rutasActivas.length > 6) {
      const verMasBtn = document.createElement('div');
      verMasBtn.className = 'text-center mt-4';
      verMasBtn.innerHTML = `
        <a href="comprar.html" class="btn btn-outline-primary btn-lg">
          <i class="fas fa-route"></i> Ver Todas las Rutas (${rutasActivas.length})
        </a>
      `;
      contenedor.parentNode.appendChild(verMasBtn);
    }
    
  } catch (error) {
    console.error('Error cargando rutas:', error);
    contenedor.innerHTML = `
      <div class="text-center p-5">
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle fa-2x mb-3"></i>
          <h5>Error al cargar rutas</h5>
          <p>No se pudieron cargar las rutas disponibles. Inténtalo más tarde.</p>
          <button class="btn btn-outline-danger btn-sm" onclick="cargarRutasDinamicas()">
            <i class="fas fa-redo"></i> Reintentar
          </button>
        </div>
      </div>
    `;
    // Ocultar botones de navegación
    document.getElementById('rutasPrev').style.display = 'none';
    document.getElementById('rutasNext').style.display = 'none';
  }
}

async function obtenerImagenRuta(origen, destino) {
  try {
    const response = await fetch(`http://localhost:8000/backend_php/api/imagenes.php?ruta=${origen}-${destino}&v=${new Date().getTime()}`);
    
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Error obteniendo imagen para ruta:', error);
  }
  
  // Mapear ciudades a imágenes disponibles
  const mapaCiudades = {
    'Lima': 'Lima.jpg',
    'Trujillo': 'Trujillo.jpg',
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
  
  const imagenArchivo = mapaCiudades[ciudadOrigen] || mapaCiudades[ciudadDestino] || 'Lima.jpg';
  
  return {
    imagen: imagenArchivo,
    url: `img/rutas/${imagenArchivo}`
  };
}

function crearTarjetaRuta(ruta, imagenInfo) {
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
      <div class="card h-100 shadow-sm border-0">
        <div class="position-relative">
          <img src="${imagenInfo.url}" class="card-img-top" alt="Ruta ${ruta.origen} - ${ruta.destino}" style="height: 200px; object-fit: cover;">
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

// Función para mejorar la navegación del scroll horizontal
function mejorarScrollHorizontal() {
  const scrollWrapper = document.getElementById('rutas-dinamicas');
  const scrollHint = document.querySelector('.scroll-hint');
  
  if (!scrollWrapper || !scrollHint) return;
  
  // Ocultar el hint cuando se termine de cargar y no haya overflow
  const checkOverflow = () => {
    if (scrollWrapper.scrollWidth <= scrollWrapper.clientWidth) {
      scrollHint.style.display = 'none';
    } else {
      scrollHint.style.display = 'block';
    }
  };
  
  // Verificar overflow después de que se carguen las rutas
  setTimeout(checkOverflow, 1000);
  
  // Agregar indicadores de scroll
  let isScrolling = false;
  
  scrollWrapper.addEventListener('scroll', () => {
    if (!isScrolling) {
      isScrolling = true;
      scrollHint.style.opacity = '0.5';
      
      setTimeout(() => {
        isScrolling = false;
        scrollHint.style.opacity = '1';
      }, 1000);
    }
  });
  
  // Agregar navegación con teclado
  scrollWrapper.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollWrapper.scrollBy({ left: -300, behavior: 'smooth' });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollWrapper.scrollBy({ left: 300, behavior: 'smooth' });
    }
  });
}

// Llamar la función después de cargar las rutas
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(mejorarScrollHorizontal, 2000);
});

// Variables para navegación circular
let rutasData = [];
let currentIndex = 0;
let rutasPerPage = 3;

// Función para navegación circular de rutas
function inicializarNavegacionRutas() {
  const prevBtn = document.getElementById('rutasPrev');
  const nextBtn = document.getElementById('rutasNext');
  const contenedor = document.getElementById('rutas-dinamicas');
  
  if (!prevBtn || !nextBtn || !contenedor) return;
  
  // Ajustar rutas por página según el tamaño de pantalla
  const updateRutasPerPage = () => {
    if (window.innerWidth <= 768) {
      rutasPerPage = 1;
    } else if (window.innerWidth <= 1024) {
      rutasPerPage = 2;
    } else {
      rutasPerPage = 3;
    }
    crearIndicadores();
    mostrarRutasActuales();
  };
  
  // Mostrar rutas actuales basado en el índice
  const mostrarRutasActuales = () => {
    if (rutasData.length === 0) return;
    
    contenedor.innerHTML = '';
    
    // Mostrar rutas de forma circular
    for (let i = 0; i < rutasPerPage; i++) {
      const rutaIndex = (currentIndex + i) % rutasData.length;
      const ruta = rutasData[rutaIndex];
      const tarjetaRuta = crearTarjetaRuta(ruta.ruta, ruta.imagen);
      contenedor.innerHTML += tarjetaRuta;
    }
    
    // Actualizar estado de botones
    actualizarEstadoBotones();
    crearIndicadores();
  };
  
  // Crear indicadores de página
  const crearIndicadores = () => {
    const indicatorsContainer = document.getElementById('rutasIndicators');
    if (!indicatorsContainer) return;
    
    indicatorsContainer.innerHTML = '';
    
    if (rutasData.length <= rutasPerPage) {
      indicatorsContainer.style.display = 'none';
      return;
    }
    
    indicatorsContainer.style.display = 'flex';
    
    const totalPages = Math.ceil(rutasData.length / rutasPerPage);
    for (let i = 0; i < totalPages; i++) {
      const indicator = document.createElement('div');
      indicator.className = 'rutas-indicator';
      indicator.addEventListener('click', () => {
        currentIndex = i * rutasPerPage;
        if (currentIndex >= rutasData.length) {
          currentIndex = rutasData.length - rutasPerPage;
        }
        mostrarRutasActuales();
      });
      indicatorsContainer.appendChild(indicator);
    }
    
    // Actualizar indicadores activos
    const currentPage = Math.floor(currentIndex / rutasPerPage);
    const indicators = document.querySelectorAll('.rutas-indicator');
    indicators.forEach((indicator, index) => {
      if (index === currentPage) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });
  };
  
  // Actualizar estado de botones
  const actualizarEstadoBotones = () => {
    if (rutasData.length <= rutasPerPage) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'block';
      nextBtn.style.display = 'block';
    }
  };
  
  // Actualizar indicadores activos
  const actualizarIndicadores = () => {
    const indicators = document.querySelectorAll('.rutas-indicator');
    const currentPage = Math.floor(currentIndex / rutasPerPage);
    
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
    if (rutasData.length > 0) {
      currentIndex = (currentIndex - 1 + rutasData.length) % rutasData.length;
      mostrarRutasActuales();
    }
  });
  
  // Navegar a la siguiente
  nextBtn.addEventListener('click', () => {
    if (rutasData.length > 0) {
      currentIndex = (currentIndex + 1) % rutasData.length;
      mostrarRutasActuales();
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
  window.addEventListener('resize', updateRutasPerPage);
  updateRutasPerPage();
  
  // Exponer funciones para uso externo
  window.mostrarRutasActuales = mostrarRutasActuales;
  window.actualizarRutasData = (data) => {
    rutasData = data;
    currentIndex = 0;
    crearIndicadores();
    mostrarRutasActuales();
  };
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarNavegacionRutas);

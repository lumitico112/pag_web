// Dashboard Admin - Gestión completa de rutas con ubicaciones jerárquicas de Perú

// Variables globales
let rutaEditando = null;

// Variables de paginación y filtrado para usuarios
let usuariosPaginacion = {
  paginaActual: 1,
  usuariosPorPagina: 10,
  totalUsuarios: 0,
  usuariosFiltrados: [],
  busqueda: '',
  filtroRol: ''
};

// Mostrar formulario de nueva ruta
function mostrarFormularioRuta() {
  document.getElementById('formRuta').style.display = 'block';
  // Cargar regiones usando el sistema unificado
  cargarRegionesUnificado('regionOrigen');
  cargarRegionesUnificado('regionDestino');
  
  // Establecer fecha mínima como hoy
  const hoy = new Date().toISOString().split('T')[0];
  document.getElementById('fechaSalida').setAttribute('min', hoy);
  
  // Limpiar formulario
  document.getElementById('rutaForm').reset();
  document.getElementById('capacidad').value = '40';
  document.getElementById('estado').value = 'activo';
  rutaEditando = null;
}

function ocultarFormularioRuta() {
  document.getElementById('formRuta').style.display = 'none';
  rutaEditando = null;
}

// Configurar eventos de cambio para los selectores de ubicación
function configurarEventosUbicacion() {
  // Eventos para origen
  document.getElementById('regionOrigen')?.addEventListener('change', function() {
    const region = this.value;
    cargarProvinciasUnificado(region, 'provinciaOrigen');
    limpiarSelectores(['distritoOrigen', 'ciudadOrigen']);
    actualizarCalculos();
  });
  
  document.getElementById('provinciaOrigen')?.addEventListener('change', function() {
    const region = document.getElementById('regionOrigen').value;
    const provincia = this.value;
    cargarCiudadesUnificado(region, provincia, '', 'ciudadOrigen');
    actualizarCalculos();
  });
  
  document.getElementById('ciudadOrigen')?.addEventListener('change', actualizarCalculos);
  
  // Eventos para destino
  document.getElementById('regionDestino')?.addEventListener('change', function() {
    const region = this.value;
    cargarProvinciasUnificado(region, 'provinciaDestino');
    limpiarSelectores(['distritoDestino', 'ciudadDestino']);
    actualizarCalculos();
  });
  
  document.getElementById('provinciaDestino')?.addEventListener('change', function() {
    const region = document.getElementById('regionDestino').value;
    const provincia = this.value;
    cargarCiudadesUnificado(region, provincia, '', 'ciudadDestino');
    actualizarCalculos();
  });
  
  document.getElementById('ciudadDestino')?.addEventListener('change', actualizarCalculos);
  
  // Eventos para fecha y hora
  document.getElementById('fechaSalida')?.addEventListener('change', actualizarFechaLlegada);
  document.getElementById('horaSalida')?.addEventListener('change', actualizarFechaLlegada);
}

// Limpiar selectores dependientes
function limpiarSelectores(selectores) {
  selectores.forEach(id => {
    const select = document.getElementById(id);
    if (select) {
      select.innerHTML = `<option value="">Seleccionar ${id.includes('provincia') ? 'Provincia' : 
                         id.includes('distrito') ? 'Distrito' : 'Ciudad'}</option>`;
    }
  });
}

// Actualizar cálculos automáticos (ahora solo sugerencias)
async function actualizarCalculos() {
  const origen = obtenerUbicacionCompleta('Origen');
  const destino = obtenerUbicacionCompleta('Destino');
  
  if (origen.ciudad && destino.ciudad) {
    const coordOrigen = obtenerCoordenadasUnificado(origen.ciudad);
    const coordDestino = obtenerCoordenadasUnificado(destino.ciudad);
    
    if (coordOrigen && coordDestino) {
      const distancia = calcularDistancia(coordOrigen.lat, coordOrigen.lng, coordDestino.lat, coordDestino.lng);
      const precio = calcularPrecio(distancia);
      const duracion = calcularDuracion(distancia);
      
      // Solo sugerir si los campos están vacíos
      const campoDistancia = document.getElementById('distancia');
      const campoPrecio = document.getElementById('precio');
      const campoDuracion = document.getElementById('duracion');
      
      // Mostrar sugerencias sin sobrescribir
      mostrarSugerenciasCalculos(distancia, precio, duracion);
      
      // Sugerir imagen automáticamente
      await sugerirImagen(origen.ciudad, destino.ciudad);
      
      actualizarFechaLlegada();
    }
  }
}

// Mostrar sugerencias de cálculos
function mostrarSugerenciasCalculos(distancia, precio, duracion) {
  // Buscar o crear contenedor de sugerencias
  let contenedorSugerencias = document.getElementById('sugerencias-calculo');
  if (!contenedorSugerencias) {
    contenedorSugerencias = document.createElement('div');
    contenedorSugerencias.id = 'sugerencias-calculo';
    contenedorSugerencias.className = 'mt-3';
    
    // Insertar después del campo duración
    const campoDuracion = document.getElementById('duracion');
    if (campoDuracion && campoDuracion.parentNode) {
      campoDuracion.parentNode.appendChild(contenedorSugerencias);
    }
  }
  
  contenedorSugerencias.innerHTML = `
    <div class="alert alert-info">
      <h6><i class="fas fa-calculator"></i> Valores Calculados Automáticamente:</h6>
      <div class="row">
        <div class="col-md-4">
          <strong>Distancia:</strong> ${distancia.toFixed(1)} km
          <button type="button" class="btn btn-sm btn-outline-primary ms-2" 
                  onclick="aplicarValor('distancia', '${distancia.toFixed(1)}')">
            <i class="fas fa-copy"></i>
          </button>
        </div>
        <div class="col-md-4">
          <strong>Precio Base:</strong> S/ ${precio.toFixed(2)}
          <button type="button" class="btn btn-sm btn-outline-primary ms-2" 
                  onclick="aplicarValor('precio', '${precio.toFixed(2)}')">
            <i class="fas fa-copy"></i>
          </button>
        </div>
        <div class="col-md-4">
          <strong>Duración:</strong> ${duracion}
          <button type="button" class="btn btn-sm btn-outline-primary ms-2" 
                  onclick="aplicarValor('duracion', '${duracion}')">
            <i class="fas fa-copy"></i>
          </button>
        </div>
      </div>
      <div class="mt-2">
        <button type="button" class="btn btn-sm btn-primary" onclick="aplicarTodosLosValores('${distancia.toFixed(1)}', '${precio.toFixed(2)}', '${duracion}')">
          <i class="fas fa-magic"></i> Aplicar Todos los Valores
        </button>
        <small class="text-muted ms-3">Los valores pueden ser editados manualmente después de aplicarlos</small>
      </div>
    </div>
  `;
}

// Aplicar valor individual
function aplicarValor(campo, valor) {
  const elemento = document.getElementById(campo);
  if (elemento) {
    elemento.value = valor;
    elemento.focus();
    elemento.style.backgroundColor = '#e7f3ff';
    setTimeout(() => {
      elemento.style.backgroundColor = '';
    }, 1000);
  }
}

// Aplicar todos los valores calculados
function aplicarTodosLosValores(distancia, precio, duracion) {
  aplicarValor('distancia', distancia);
  aplicarValor('precio', precio);
  aplicarValor('duracion', duracion);
  
  // Actualizar fecha de llegada
  actualizarFechaLlegada();
  
  // Mostrar confirmación
  const contenedor = document.getElementById('sugerencias-calculo');
  if (contenedor) {
    contenedor.innerHTML = `
      <div class="alert alert-success">
        <i class="fas fa-check"></i> Valores aplicados correctamente. Puedes editarlos manualmente si es necesario.
      </div>
    `;
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
      contenedor.style.display = 'none';
    }, 3000);
  }
}

// Nueva función para sugerir imagen basada en origen y destino
async function sugerirImagen(ciudadOrigen, ciudadDestino) {
  try {
    const response = await fetch('http://localhost:8000/backend_php/api/imagenes.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origen: ciudadOrigen, destino: ciudadDestino })
    });
    
    if (response.ok) {
      const resultado = await response.json();
      const campoImagen = document.getElementById('imagen');
      
      if (campoImagen && resultado.imagen_sugerida) {
        campoImagen.value = resultado.url;
        
        // Mostrar vista previa si existe un contenedor
        mostrarVistaPrevia(resultado.url);
        
        // Mostrar alternativas si existen
        if (resultado.alternativas && resultado.alternativas.length > 0) {
          mostrarAlternativasImagen(resultado.alternativas);
        }
      }
    }
  } catch (error) {
    console.warn('Error al sugerir imagen:', error);
  }
}

// Mostrar vista previa de la imagen seleccionada
function mostrarVistaPrevia(urlImagen) {
  let contenedorPreview = document.getElementById('imagen-preview');
  if (!contenedorPreview) {
    // Crear contenedor de vista previa si no existe
    contenedorPreview = document.createElement('div');
    contenedorPreview.id = 'imagen-preview';
    contenedorPreview.className = 'mt-2';
    
    const campoImagen = document.getElementById('imagen');
    if (campoImagen && campoImagen.parentNode) {
      campoImagen.parentNode.appendChild(contenedorPreview);
    }
  }
  
  if (urlImagen) {
    contenedorPreview.innerHTML = `
      <div class="text-center">
        <img src="${urlImagen}" alt="Vista previa" class="img-thumbnail" style="max-width: 200px; max-height: 120px;">
        <small class="d-block text-muted mt-1">Vista previa de la imagen</small>
      </div>
    `;
  } else {
    contenedorPreview.innerHTML = '';
  }
}

// Mostrar alternativas de imágenes
function mostrarAlternativasImagen(alternativas) {
  let contenedorAlternativas = document.getElementById('imagen-alternativas');
  if (!contenedorAlternativas) {
    // Crear contenedor de alternativas si no existe
    contenedorAlternativas = document.createElement('div');
    contenedorAlternativas.id = 'imagen-alternativas';
    contenedorAlternativas.className = 'mt-2';
    
    const contenedorPreview = document.getElementById('imagen-preview');
    if (contenedorPreview && contenedorPreview.parentNode) {
      contenedorPreview.parentNode.appendChild(contenedorAlternativas);
    }
  }
  
  let htmlAlternativas = '<small class="text-muted">Otras opciones:</small><div class="row mt-1">';
  
  alternativas.slice(0, 4).forEach((alt, index) => {
    htmlAlternativas += `
      <div class="col-3">
        <img src="${alt.url}" alt="${alt.nombre}" 
             class="img-thumbnail w-100 cursor-pointer imagen-alternativa" 
             style="height: 60px; object-fit: cover;"
             onclick="seleccionarImagenAlternativa('${alt.url}')"
             title="Click para seleccionar">
      </div>
    `;
  });
  
  htmlAlternativas += '</div>';
  contenedorAlternativas.innerHTML = htmlAlternativas;
}

// Seleccionar imagen alternativa
function seleccionarImagenAlternativa(urlImagen) {
  document.getElementById('imagen').value = urlImagen;
  mostrarVistaPrevia(urlImagen);
  
  // Highlight de la imagen seleccionada
  document.querySelectorAll('.imagen-alternativa').forEach(img => {
    img.style.border = '2px solid transparent';
  });
  
  event.target.style.border = '2px solid #007bff';
}

// Agregar evento al campo de imagen para mostrar vista previa manual
document.addEventListener('DOMContentLoaded', function() {
  const campoImagen = document.getElementById('imagen');
  if (campoImagen) {
    campoImagen.addEventListener('input', function() {
      mostrarVistaPrevia(this.value);
    });
  }
});

// Obtener ubicación completa de origen o destino
function obtenerUbicacionCompleta(tipo) {
  return {
    region: document.getElementById(`region${tipo}`)?.value || '',
    provincia: document.getElementById(`provincia${tipo}`)?.value || '',
    distrito: document.getElementById(`distrito${tipo}`)?.value || '',
    ciudad: document.getElementById(`ciudad${tipo}`)?.value || ''
  };
}

// Actualizar fecha y hora de llegada automáticamente
function actualizarFechaLlegada() {
  const fechaSalida = document.getElementById('fechaSalida')?.value;
  const horaSalida = document.getElementById('horaSalida')?.value;
  const duracion = document.getElementById('duracion')?.value;
  
  if (fechaSalida && horaSalida && duracion) {
    const fechaHoraSalida = new Date(`${fechaSalida}T${horaSalida}`);
    const horasDuracion = parsearDuracion(duracion);
    
    if (horasDuracion > 0) {
      const fechaHoraLlegada = new Date(fechaHoraSalida.getTime() + (horasDuracion * 60 * 60 * 1000));
      
      document.getElementById('fechaLlegada').value = fechaHoraLlegada.toISOString().split('T')[0];
      document.getElementById('horaLlegada').value = fechaHoraLlegada.toTimeString().slice(0, 5);
    }
  }
}

// Parsear duración en formato "Xh Ym" a horas decimales
function parsearDuracion(duracionStr) {
  const match = duracionStr.match(/(\d+)h\s*(\d+)?m?/);
  if (match) {
    const horas = parseInt(match[1]) || 0;
    const minutos = parseInt(match[2]) || 0;
    return horas + (minutos / 60);
  }
  return 0;
}

// Cargar rutas dinámicamente
document.addEventListener('DOMContentLoaded', function() {
  cargarRutas();
  cargarUsuarios();
  configurarEventosUbicacion();
  configurarFiltrosUsuarios();

  document.getElementById('rutaForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    await guardarRuta(e.target);
  });
});

// Guardar ruta (crear o actualizar)
async function guardarRuta(form) {
  const formData = new FormData(form);
  
  // Validar que ambas ubicaciones estén completas
  const origen = obtenerUbicacionCompleta('Origen');
  const destino = obtenerUbicacionCompleta('Destino');
  
  if (!origen.ciudad || !destino.ciudad) {
    alert('Por favor selecciona ubicaciones completas para origen y destino');
    return;
  }
  
  // Construir nombres completos de origen y destino
  const origenCompleto = `${origen.ciudad}, ${origen.distrito}, ${origen.provincia}, ${origen.region}`;
  const destinoCompleto = `${destino.ciudad}, ${destino.distrito}, ${destino.provincia}, ${destino.region}`;
  
  const data = {
    // Ubicaciones simplificadas para compatibilidad
    origen: origenCompleto,
    destino: destinoCompleto,
    
    // Ubicaciones detalladas
    origen_region: origen.region,
    origen_provincia: origen.provincia,
    origen_distrito: origen.distrito,
    origen_ciudad: origen.ciudad,
    destino_region: destino.region,
    destino_provincia: destino.provincia,
    destino_distrito: destino.distrito,
    destino_ciudad: destino.ciudad,
    
    // Información de ruta
    precio: parseFloat(formData.get('precio')),
    duracion: formData.get('duracion'),
    distancia_km: parseFloat(formData.get('distancia')),
    capacidad_pasajeros: parseInt(formData.get('capacidad')),
    
    // Horarios
    fecha_salida: formData.get('fechaSalida'),
    hora_salida: formData.get('horaSalida'),
    fecha_llegada: formData.get('fechaLlegada'),
    hora_llegada: formData.get('horaLlegada'),
    
    // Otros
    imagen: formData.get('imagen'),
    estado: formData.get('estado')
  };
  
  try {
    const url = 'http://localhost:8000/backend_php/api/rutas.php';
    const method = rutaEditando ? 'PUT' : 'POST';
    
    if (rutaEditando) {
      data.id = rutaEditando;
    }
    
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert(result.message || `Ruta ${rutaEditando ? 'actualizada' : 'creada'} exitosamente`);
      cargarRutas();
      ocultarFormularioRuta();
      form.reset();
    } else {
      throw new Error(result.message || 'Error al guardar la ruta');
    }
  } catch (err) {
    alert('Error al guardar la ruta: ' + err.message);
    console.error('Error:', err);
  }
}

async function cargarRutas() {
  try {
    const response = await fetch('http://localhost:8000/backend_php/api/rutas.php');
    const rutas = await response.json();
    const tbody = document.getElementById('tablaRutas');
    tbody.innerHTML = '';
    
    rutas.forEach(ruta => {
      const fechaSalida = ruta.fecha_salida ? new Date(ruta.fecha_salida).toLocaleDateString('es-PE') : 'No definida';
      const horaSalida = ruta.hora_salida || '';
      const capacidadUsada = ruta.pasajeros_registrados || 0;
      const capacidadTotal = ruta.capacidad_pasajeros || 40;
      const disponibilidad = capacidadTotal - capacidadUsada;
      
      // Indicador de disponibilidad
      let badgeDisponibilidad = '';
      if (disponibilidad <= 0) {
        badgeDisponibilidad = '<span class="badge bg-danger">Completo</span>';
      } else if (disponibilidad <= 5) {
        badgeDisponibilidad = '<span class="badge bg-warning">Pocos lugares</span>';
      } else {
        badgeDisponibilidad = '<span class="badge bg-success">Disponible</span>';
      }
      
      tbody.innerHTML += `<tr>
        <td>${ruta.id}</td>
        <td>
          <strong>${ruta.origen}</strong><br>
          <i class="fas fa-arrow-down text-muted"></i><br>
          <strong>${ruta.destino}</strong>
        </td>
        <td>
          ${fechaSalida}<br>
          <small class="text-muted">${horaSalida}</small>
        </td>
        <td><strong>S/ ${parseFloat(ruta.precio).toFixed(2)}</strong></td>
        <td>${ruta.duracion || 'No definida'}</td>
        <td>${ruta.distancia_km ? ruta.distancia_km + ' km' : 'No definida'}</td>
        <td>
          ${capacidadUsada}/${capacidadTotal}<br>
          ${badgeDisponibilidad}
        </td>
        <td>
          <button class="btn btn-sm btn-info" onclick="verPasajeros(${ruta.id})" title="Ver pasajeros">
            <i class="fas fa-users"></i> ${capacidadUsada}
          </button>
        </td>
        <td>
          <span class="badge bg-${ruta.estado === 'activo' ? 'success' : ruta.estado === 'inactivo' ? 'secondary' : 'warning'}">
            ${ruta.estado}
          </span>
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-warning" onclick="editarRuta(${ruta.id})" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-danger" onclick="eliminarRuta(${ruta.id})" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>`;
    });
  } catch (e) {
    alert('Error cargando rutas: ' + e.message);
    console.error('Error:', e);
  }
}

// Editar ruta existente
async function editarRuta(id) {
  try {
    const response = await fetch(`http://localhost:8000/backend_php/api/rutas.php?id=${id}`);
    const ruta = await response.json();
    
    if (ruta && ruta.length > 0) {
      const datosRuta = ruta[0];
      rutaEditando = id;
      
      // Mostrar formulario
      mostrarFormularioRuta();
      
      // Cargar datos en el formulario
      await cargarDatosEnFormulario(datosRuta);
    }
  } catch (error) {
    alert('Error al cargar datos de la ruta: ' + error.message);
  }
}

// Cargar datos de ruta en el formulario para edición
async function cargarDatosEnFormulario(ruta) {
  // Esperar un poco para que se carguen los selectores
  setTimeout(async () => {
    try {
      // Cargar región de origen y esperar
      if (ruta.origen_region) {
        document.getElementById('regionOrigen').value = ruta.origen_region;
        await cargarProvinciasUnificado(ruta.origen_region, 'provinciaOrigen');
        
        if (ruta.origen_provincia) {
          document.getElementById('provinciaOrigen').value = ruta.origen_provincia;
          await cargarCiudadesUnificado(ruta.origen_region, ruta.origen_provincia, '', 'ciudadOrigen');
          
          if (ruta.origen_ciudad) {
            document.getElementById('ciudadOrigen').value = ruta.origen_ciudad;
          }
        }
      }
      
      // Cargar región de destino y esperar
      if (ruta.destino_region) {
        document.getElementById('regionDestino').value = ruta.destino_region;
        await cargarProvinciasUnificado(ruta.destino_region, 'provinciaDestino');
        
        if (ruta.destino_provincia) {
          document.getElementById('provinciaDestino').value = ruta.destino_provincia;
          await cargarCiudadesUnificado(ruta.destino_region, ruta.destino_provincia, '', 'ciudadDestino');
          
          if (ruta.destino_ciudad) {
            document.getElementById('ciudadDestino').value = ruta.destino_ciudad;
          }
        }
      }
      
      // Cargar otros campos
      document.getElementById('precio').value = ruta.precio || '';
      document.getElementById('duracion').value = ruta.duracion || '';
      document.getElementById('distancia').value = ruta.distancia_km || '';
      document.getElementById('capacidad').value = ruta.capacidad_pasajeros || 40;
      document.getElementById('fechaSalida').value = ruta.fecha_salida || '';
      document.getElementById('horaSalida').value = ruta.hora_salida || '';
      document.getElementById('fechaLlegada').value = ruta.fecha_llegada || '';
      document.getElementById('horaLlegada').value = ruta.hora_llegada || '';
      document.getElementById('imagen').value = ruta.imagen || '';
      document.getElementById('estado').value = ruta.estado || 'activo';
      
    } catch (error) {
      console.error('Error cargando datos en formulario:', error);
    }
  }, 500);
}

// Eliminar ruta
async function eliminarRuta(id) {
  if (confirm('¿Estás seguro de que quieres eliminar esta ruta?')) {
    try {
      const response = await fetch(`http://localhost:8000/backend_php/api/rutas.php?id=${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Ruta eliminada exitosamente');
        cargarRutas();
      } else {
        throw new Error(result.message || 'Error al eliminar la ruta');
      }
    } catch (error) {
      alert('Error al eliminar la ruta: ' + error.message);
    }
  }
}

// Ver pasajeros de una ruta
async function verPasajeros(rutaId) {
  try {
    const response = await fetch(`http://localhost:8000/backend_php/api/reservas.php?ruta_id=${rutaId}`);
    const pasajeros = await response.json();
    
    if (pasajeros && pasajeros.length > 0) {
      let html = `
        <div class="modal fade" id="modalPasajeros" tabindex="-1">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Pasajeros Registrados - Ruta ${rutaId}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <div class="table-responsive">
                  <table class="table table-striped">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Fecha Reserva</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
      `;
      
      pasajeros.forEach(pasajero => {
        html += `
          <tr>
            <td>${pasajero.nombre_completo || 'No disponible'}</td>
            <td>${pasajero.email}</td>
            <td>${new Date(pasajero.fecha_reserva).toLocaleDateString('es-PE')}</td>
            <td><span class="badge bg-success">Confirmado</span></td>
          </tr>
        `;
      });
      
      html += `
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Remover modal anterior si existe
      const modalAnterior = document.getElementById('modalPasajeros');
      if (modalAnterior) {
        modalAnterior.remove();
      }
      
      // Agregar modal al DOM
      document.body.insertAdjacentHTML('beforeend', html);
      
      // Mostrar modal
      const modal = new bootstrap.Modal(document.getElementById('modalPasajeros'));
      modal.show();
    } else {
      alert('No hay pasajeros registrados para esta ruta');
    }
  } catch (error) {
    alert('Error al cargar pasajeros: ' + error.message);
  }
}

async function cargarUsuarios() {
  try {
    console.log('Iniciando carga de usuarios...');
    const response = await fetch(`http://localhost:8000/backend_php/api/users.php?v=${new Date().getTime()}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const usuarios = await response.json();
    console.log('Usuarios obtenidos:', usuarios);
    
    if (!Array.isArray(usuarios)) {
      throw new Error('Formato de respuesta inválido');
    }
    
    // Limpiar tabla
    const tbody = document.getElementById('tablaUsuarios');
    if (!tbody) {
      console.error('No se encontró el elemento tablaUsuarios');
      return;
    }
    
    tbody.innerHTML = '';
    
    // Si no hay usuarios
    if (usuarios.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted">
            <i class="fas fa-users"></i><br>
            No hay usuarios registrados
          </td>
        </tr>
      `;
      return;
    }
    
    // Mostrar usuarios directamente
    usuarios.forEach(usuario => {
      const rolUsuario = usuario.rol || 'usuario';
      const estadoActivo = usuario.is_active !== undefined ? usuario.is_active : true;
      
      tbody.innerHTML += `
        <tr>
          <td>${usuario.id}</td>
          <td>
            <div>
              <strong>${usuario.nombre_completo || usuario.email}</strong>
              ${usuario.nombre_completo ? `<br><small class="text-muted">${usuario.email}</small>` : ''}
            </div>
          </td>
          <td>
            <span class="badge bg-${rolUsuario === 'admin' ? 'danger' : rolUsuario === 'trabajador' ? 'warning' : 'primary'}">
              ${rolUsuario}
            </span>
            <br><span class="badge bg-${estadoActivo ? 'success' : 'secondary'} mt-1">
              ${estadoActivo ? 'Activo' : 'Inactivo'}
            </span>
          </td>
          <td>
            <small class="text-muted">
              ${usuario.created_at ? new Date(usuario.created_at).toLocaleDateString('es-ES') : 'No disponible'}
            </small>
          </td>
          <td>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-primary" onclick="cambiarRolUsuario(${usuario.id}, '${rolUsuario}')" 
                      title="Cambiar rol">
                <i class="fas fa-user-cog"></i>
              </button>
              ${rolUsuario !== 'admin' ? `
                <button class="btn btn-outline-${estadoActivo ? 'danger' : 'success'}" 
                        onclick="toggleActivarUsuario(${usuario.id}, ${!estadoActivo})" 
                        title="${estadoActivo ? 'Desactivar' : 'Activar'} usuario">
                  <i class="fas fa-user-${estadoActivo ? 'times' : 'check'}"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    });
    
    console.log('Usuarios cargados exitosamente:', usuarios.length);
    
  } catch (error) {
    console.error('Error cargando usuarios:', error);
    const tbody = document.getElementById('tablaUsuarios');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-danger">
            <i class="fas fa-exclamation-triangle"></i><br>
            Error al cargar usuarios: ${error.message}
            <br>
            <button class="btn btn-sm btn-outline-danger mt-2" onclick="cargarUsuarios()">
              <i class="fas fa-redo"></i> Reintentar
            </button>
          </td>
        </tr>
      `;
    }
  }
}

// Función para aplicar paginación y filtrado
function aplicarPaginacionYFiltrado(usuarios) {
  // Filtrar usuarios según criterios
  const usuariosFiltrados = filtrarUsuarios(usuarios);
  
  // Actualizar variables de paginación
  usuariosPaginacion.usuariosFiltrados = usuariosFiltrados;
  usuariosPaginacion.totalUsuarios = usuariosFiltrados.length;
  
  // Mostrar usuarios paginados
  mostrarUsuarios(usuariosFiltrados);
}

// Función para filtrar usuarios
function filtrarUsuarios(usuarios) {
  let filtrados = usuarios;
  
  // Filtrar por búsqueda
  if (usuariosPaginacion.busqueda) {
    const termino = usuariosPaginacion.busqueda.toLowerCase();
    filtrados = filtrados.filter(usuario => 
      (usuario.nombre_completo || '').toLowerCase().includes(termino) ||
      (usuario.email || '').toLowerCase().includes(termino) ||
      (usuario.rol || 'usuario').toLowerCase().includes(termino)
    );
  }
  
  // Filtrar por rol
  if (usuariosPaginacion.filtroRole) {
    filtrados = filtrados.filter(usuario => 
      (usuario.role || 'usuario') === usuariosPaginacion.filtroRole
    );
  }
  
  usuariosPaginacion.usuariosFiltrados = filtrados;
  usuariosPaginacion.totalUsuarios = filtrados.length;
  
  return filtrados;
}

// Función para obtener usuarios de la página actual
function obtenerUsuariosPagina(usuarios) {
  const inicio = (usuariosPaginacion.paginaActual - 1) * usuariosPaginacion.usuariosPorPagina;
  const fin = inicio + usuariosPaginacion.usuariosPorPagina;
  return usuarios.slice(inicio, fin);
}

// Función para generar paginación
function generarPaginacionUsuarios() {
  const totalPaginas = Math.ceil(usuariosPaginacion.totalUsuarios / usuariosPaginacion.usuariosPorPagina);
  const paginacion = document.getElementById('paginacionUsuarios');
  
  if (!paginacion) return;
  
  let html = '';
  
  // Botón anterior
  if (usuariosPaginacion.paginaActual > 1) {
    html += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="cambiarPaginaUsuarios(${usuariosPaginacion.paginaActual - 1})">
          <i class="fas fa-chevron-left"></i>
        </a>
      </li>
    `;
  }
  
  // Números de página
  const inicioNumeros = Math.max(1, usuariosPaginacion.paginaActual - 2);
  const finNumeros = Math.min(totalPaginas, usuariosPaginacion.paginaActual + 2);
  
  if (inicioNumeros > 1) {
    html += `<li class="page-item"><a class="page-link" href="#" onclick="cambiarPaginaUsuarios(1)">1</a></li>`;
    if (inicioNumeros > 2) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }
  
  for (let i = inicioNumeros; i <= finNumeros; i++) {
    const activo = i === usuariosPaginacion.paginaActual ? 'active' : '';
    html += `
      <li class="page-item ${activo}">
        <a class="page-link" href="#" onclick="cambiarPaginaUsuarios(${i})">${i}</a>
      </li>
    `;
  }
  
  if (finNumeros < totalPaginas) {
    if (finNumeros < totalPaginas - 1) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    html += `<li class="page-item"><a class="page-link" href="#" onclick="cambiarPaginaUsuarios(${totalPaginas})">${totalPaginas}</a></li>`;
  }
  
  // Botón siguiente
  if (usuariosPaginacion.paginaActual < totalPaginas) {
    html += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="cambiarPaginaUsuarios(${usuariosPaginacion.paginaActual + 1})">
          <i class="fas fa-chevron-right"></i>
        </a>
      </li>
    `;
  }
  
  paginacion.innerHTML = html;
  
  // Actualizar información
  const info = document.getElementById('infoUsuarios');
  if (info) {
    const inicio = (usuariosPaginacion.paginaActual - 1) * usuariosPaginacion.usuariosPorPagina + 1;
    const fin = Math.min(inicio + usuariosPaginacion.usuariosPorPagina - 1, usuariosPaginacion.totalUsuarios);
    info.textContent = `Mostrando ${inicio}-${fin} de ${usuariosPaginacion.totalUsuarios} usuarios`;
  }
}

// Función para cambiar página
function cambiarPaginaUsuarios(pagina) {
  usuariosPaginacion.paginaActual = pagina;
  mostrarUsuarios(usuariosPaginacion.usuariosFiltrados);
}

// Función para configurar event listeners de búsqueda y filtros
function configurarFiltrosUsuarios() {
  const buscarInput = document.getElementById('buscarUsuario');
  const filtroRol = document.getElementById('filtroRolUsuario');
  const usuariosPorPagina = document.getElementById('usuariosPorPagina');
  
  if (buscarInput) {
    buscarInput.addEventListener('input', function() {
      usuariosPaginacion.busqueda = this.value;
      usuariosPaginacion.paginaActual = 1;
      cargarUsuarios();
    });
  }
  
  if (filtroRol) {
    filtroRol.addEventListener('change', function() {
      usuariosPaginacion.filtroRol = this.value;
      usuariosPaginacion.paginaActual = 1;
      cargarUsuarios();
    });
  }
  
  if (usuariosPorPagina) {
    usuariosPorPagina.addEventListener('change', function() {
      usuariosPaginacion.usuariosPorPagina = parseInt(this.value);
      usuariosPaginacion.paginaActual = 1;
      cargarUsuarios();
    });
  }
}

// ========== FUNCIONES UNIFICADAS PARA CARGA DE UBICACIONES ==========

// Cargar regiones usando el sistema unificado
async function cargarRegionesUnificado(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  // Mostrar loading
  select.innerHTML = '<option value="">Cargando regiones...</option>';

  try {
    // Verificar si hay sistema unificado disponible
    if (window.sistemaUbicaciones) {
      const regiones = await window.sistemaUbicaciones.cargarRegionesUnificado();
      
      select.innerHTML = '<option value="">Seleccionar Región</option>';
      
      regiones.forEach(region => {
        const option = document.createElement('option');
        option.value = region.nombre || region.name; // Compatibilidad con ambos sistemas
        option.textContent = region.nombre || region.name;
        option.dataset.id = region.id;
        option.dataset.tipo = region.tipo || 'geodb';
        select.appendChild(option);
      });
    } else {
      // Fallback a datos locales si no hay sistema unificado
      await cargarRegionesLocal(selectId);
    }
    
  } catch (error) {
    console.error('Error cargando regiones:', error);
    select.innerHTML = '<option value="">Error cargando regiones</option>';
    
    // Intentar fallback
    try {
      await cargarRegionesLocal(selectId);
    } catch (fallbackError) {
      console.error('Error en fallback:', fallbackError);
    }
  }
}

// Cargar provincias usando el sistema unificado
async function cargarProvinciasUnificado(regionNombre, selectId) {
  const select = document.getElementById(selectId);
  if (!select || !regionNombre) return;

  select.innerHTML = '<option value="">Cargando provincias...</option>';

  try {
    if (window.sistemaUbicaciones) {
      // Obtener el ID de la región desde el selector
      const regionSelect = document.getElementById(selectId.replace('provincia', 'region'));
      const regionId = regionSelect?.selectedOptions[0]?.dataset?.id || regionNombre;
      
      const provincias = await window.sistemaUbicaciones.cargarProvinciasUnificado(regionId, regionNombre);
      
      select.innerHTML = '<option value="">Seleccionar Provincia</option>';
      
      provincias.forEach(provincia => {
        const option = document.createElement('option');
        option.value = provincia.nombre || provincia.name;
        option.textContent = provincia.nombre || provincia.name;
        option.dataset.id = provincia.id;
        option.dataset.tipo = provincia.tipo || 'geodb';
        select.appendChild(option);
      });
    } else {
      await cargarProvinciasLocal(regionNombre, selectId);
    }
    
  } catch (error) {
    console.error('Error cargando provincias:', error);
    select.innerHTML = '<option value="">Error cargando provincias</option>';
    
    try {
      await cargarProvinciasLocal(regionNombre, selectId);
    } catch (fallbackError) {
      console.error('Error en fallback:', fallbackError);
    }
  }
}

// Cargar ciudades usando el sistema unificado
async function cargarCiudadesUnificado(regionNombre, provinciaNombre, distritoNombre, selectId) {
  const select = document.getElementById(selectId);
  if (!select || !provinciaNombre) return;

  select.innerHTML = '<option value="">Cargando ciudades...</option>';

  try {
    if (window.sistemaUbicaciones) {
      // Obtener el ID de la provincia desde el selector
      const provinciaSelect = document.getElementById(selectId.replace('ciudad', 'provincia'));
      const provinciaId = provinciaSelect?.selectedOptions[0]?.dataset?.id || provinciaNombre;
      
      const ciudades = await window.sistemaUbicaciones.cargarCiudadesUnificado(provinciaId, provinciaNombre, regionNombre);
      
      select.innerHTML = '<option value="">Seleccionar Ciudad</option>';
      
      ciudades.forEach(ciudad => {
        const option = document.createElement('option');
        option.value = ciudad.nombre || ciudad.name;
        option.textContent = `${ciudad.nombre || ciudad.name}${ciudad.poblacion ? ` (${ciudad.poblacion.toLocaleString()} hab.)` : ''}`;
        option.dataset.id = ciudad.id;
        option.dataset.latitud = ciudad.latitud || ciudad.latitude;
        option.dataset.longitud = ciudad.longitud || ciudad.longitude;
        option.dataset.tipo = ciudad.tipo || 'geodb';
        select.appendChild(option);
      });
    } else {
      await cargarCiudadesLocal(regionNombre, provinciaNombre, selectId);
    }
    
  } catch (error) {
    console.error('Error cargando ciudades:', error);
    select.innerHTML = '<option value="">Error cargando ciudades</option>';
    
    try {
      await cargarCiudadesLocal(regionNombre, provinciaNombre, selectId);
    } catch (fallbackError) {
      console.error('Error en fallback:', fallbackError);
    }
  }
}

// ========== FUNCIONES DE FALLBACK LOCAL ==========

// Cargar regiones desde datos locales
async function cargarRegionesLocal(selectId) {
  const select = document.getElementById(selectId);
  if (!select || typeof UBICACIONES_PERU === 'undefined') return;

  select.innerHTML = '<option value="">Seleccionar Región</option>';
  
  Object.keys(UBICACIONES_PERU).forEach((region, index) => {
    const option = document.createElement('option');
    option.value = region;
    option.textContent = region;
    option.dataset.id = `local_${index}`;
    option.dataset.tipo = 'local';
    select.appendChild(option);
  });
}

// Cargar provincias desde datos locales
async function cargarProvinciasLocal(regionNombre, selectId) {
  const select = document.getElementById(selectId);
  if (!select || typeof UBICACIONES_PERU === 'undefined' || !UBICACIONES_PERU[regionNombre]) return;

  select.innerHTML = '<option value="">Seleccionar Provincia</option>';
  
  Object.keys(UBICACIONES_PERU[regionNombre]).forEach((provincia, index) => {
    const option = document.createElement('option');
    option.value = provincia;
    option.textContent = provincia;
    option.dataset.id = `local_${regionNombre}_${index}`;
    option.dataset.tipo = 'local';
    select.appendChild(option);
  });
}

// Cargar ciudades desde datos locales
async function cargarCiudadesLocal(regionNombre, provinciaNombre, selectId) {
  const select = document.getElementById(selectId);
  if (!select || typeof UBICACIONES_PERU === 'undefined' || 
      !UBICACIONES_PERU[regionNombre] || !UBICACIONES_PERU[regionNombre][provinciaNombre]) return;

  select.innerHTML = '<option value="">Seleccionar Ciudad</option>';
  
  const distritos = UBICACIONES_PERU[regionNombre][provinciaNombre];
  let ciudadIndex = 0;
  
  Object.keys(distritos).forEach(distrito => {
    distritos[distrito].forEach(ciudad => {
      const option = document.createElement('option');
      option.value = ciudad;
      option.textContent = `${ciudad} (${distrito})`;
      option.dataset.id = `local_${regionNombre}_${provinciaNombre}_${distrito}_${ciudadIndex}`;
      option.dataset.distrito = distrito;
      option.dataset.tipo = 'local';
      
      // Agregar coordenadas si están disponibles
      const coordenadas = obtenerCoordenadasLocal(ciudad);
      if (coordenadas) {
        option.dataset.latitud = coordenadas.lat;
        option.dataset.longitud = coordenadas.lng;
      }
      
      select.appendChild(option);
      ciudadIndex++;
    });
  });
}

// Obtener coordenadas desde el sistema unificado
function obtenerCoordenadasUnificado(nombreCiudad) {
  // Intentar primero con el sistema unificado
  if (window.sistemaUbicaciones) {
    return window.sistemaUbicaciones.obtenerCoordenadas(nombreCiudad);
  }
  
  // Fallback a coordenadas locales
  return obtenerCoordenadasLocal(nombreCiudad);
}

// Obtener coordenadas desde datos locales
function obtenerCoordenadasLocal(nombreCiudad) {
  const coordenadas = {
    'Lima Centro': { lat: -12.0464, lng: -77.0428 },
    'Miraflores': { lat: -12.1210, lng: -77.0282 },
    'San Isidro': { lat: -12.1028, lng: -77.0365 },
    'Barranco': { lat: -12.1405, lng: -77.0196 },
    'Callao': { lat: -12.0566, lng: -77.1181 },
    'Huaral Ciudad': { lat: -11.4950, lng: -77.2072 },
    'Chancay Puerto': { lat: -11.5672, lng: -77.2703 },
    'Barranca Ciudad': { lat: -10.7500, lng: -77.7667 },
    'Supe Puerto': { lat: -10.7989, lng: -77.7158 },
    'Huacho Ciudad': { lat: -11.1067, lng: -77.6050 },
    'Trujillo Centro': { lat: -8.1116, lng: -79.0297 },
    'Huanchaco': { lat: -8.0783, lng: -79.1217 },
    'Chiclayo Ciudad': { lat: -6.7714, lng: -79.8370 },
    'Lambayeque': { lat: -6.7019, lng: -79.9061 },
    'Huancayo Ciudad': { lat: -12.0653, lng: -75.2049 },
    'La Oroya': { lat: -11.5189, lng: -75.8997 },
    'Arequipa Ciudad': { lat: -16.4090, lng: -71.5375 },
    'Cusco Ciudad': { lat: -13.5319, lng: -71.9675 },
    'Iquitos Ciudad': { lat: -3.7437, lng: -73.2516 },
    'Piura Ciudad': { lat: -5.1945, lng: -80.6328 },
    'Tacna Ciudad': { lat: -18.0146, lng: -70.2536 },
    'Pucallpa Ciudad': { lat: -8.3791, lng: -74.5539 },
    'Chimbote Puerto': { lat: -9.0853, lng: -78.5784 },
    'Ica Ciudad': { lat: -14.0777, lng: -75.7286 }
  };
  
  return coordenadas[nombreCiudad] || null;
}

// ========== FUNCIÓN DE CONFIGURACIÓN DE UBICACIONES ==========

// Mostrar modal de configuración del sistema de ubicaciones
function mostrarConfiguracionUbicaciones() {
  const modalHtml = `
    <div class="modal fade" id="modalConfigUbicaciones" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="fas fa-map-marked-alt"></i> Configuración del Sistema de Ubicaciones
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <div class="card h-100">
                  <div class="card-header bg-success text-white">
                    <h6 class="mb-0"><i class="fas fa-database"></i> Sistema Local</h6>
                  </div>
                  <div class="card-body">
                    <ul class="list-unstyled">
                      <li><i class="fas fa-check text-success"></i> No requiere internet</li>
                      <li><i class="fas fa-check text-success"></i> Respuesta instantánea</li>
                      <li><i class="fas fa-check text-success"></i> Datos curados para Perú</li>
                      <li><i class="fas fa-check text-success"></i> Control total</li>
                    </ul>
                    <button class="btn btn-success btn-sm" onclick="configurarSistemaLocal()">
                      <i class="fas fa-database"></i> Usar Sistema Local
                    </button>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card h-100">
                  <div class="card-header bg-info text-white">
                    <h6 class="mb-0"><i class="fas fa-cloud"></i> GeoDB Cities API</h6>
                  </div>
                  <div class="card-body">
                    <ul class="list-unstyled">
                      <li><i class="fas fa-check text-info"></i> 195,000+ ciudades</li>
                      <li><i class="fas fa-check text-info"></i> Datos actualizados</li>
                      <li><i class="fas fa-check text-info"></i> Coordenadas precisas</li>
                      <li><i class="fas fa-check text-info"></i> Información poblacional</li>
                    </ul>
                    
                    <div class="mb-3">
                      <label class="form-label">API Key de GeoDB Cities</label>
                      <input type="text" class="form-control" id="apiKeyGeoDB" 
                             placeholder="Ingresa tu API Key de RapidAPI">
                      <small class="text-muted">
                        <a href="https://rapidapi.com/wirefreethought/api/geodb-cities" target="_blank">
                          <i class="fas fa-external-link-alt"></i> Obtener API Key gratuita
                        </a>
                      </small>
                    </div>
                    
                    <button class="btn btn-info btn-sm" onclick="configurarSistemaGeoDB()">
                      <i class="fas fa-cloud"></i> Usar GeoDB Cities
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="alert alert-info mt-3">
              <h6><i class="fas fa-info-circle"></i> Sistema Actual:</h6>
              <div id="estadoSistemaActual">Cargando información del sistema...</div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              <i class="fas fa-times"></i> Cerrar
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
  
  // Mostrar información del sistema actual
  actualizarEstadoSistema();
  
  // Cargar API Key guardada si existe
  const apiKeySaved = localStorage.getItem('geodb_api_key');
  if (apiKeySaved && apiKeySaved !== 'TU_API_KEY_AQUI') {
    document.getElementById('apiKeyGeoDB').value = apiKeySaved;
  }
  
  // Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById('modalConfigUbicaciones'));
  modal.show();
}

// Configurar sistema local
function configurarSistemaLocal() {
  if (window.sistemaUbicaciones) {
    window.sistemaUbicaciones.configurarModo('local');
  }
  
  // Actualizar estado
  actualizarEstadoSistema();
  
  // Mostrar confirmación
  mostrarNotificacion('Sistema configurado en modo Local', 'success');
  
  // Recargar selectores si están visibles
  recargarSelectoresUbicacion();
}

// Configurar sistema GeoDB
async function configurarSistemaGeoDB() {
  const apiKey = document.getElementById('apiKeyGeoDB').value.trim();
  
  if (!apiKey) {
    alert('Por favor ingresa una API Key válida para GeoDB Cities');
    return;
  }
  
  try {
    // Verificar que la API Key funcione
    const testResponse = await fetch('https://wft-geo-db.p.rapidapi.com/v1/geo/countries/PE', {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
      }
    });
    
    if (!testResponse.ok) {
      throw new Error('API Key inválida o sin permisos');
    }
    
    // Configurar sistema
    if (window.sistemaUbicaciones) {
      window.sistemaUbicaciones.configurarModo('geodb', apiKey);
    }
    
    // Guardar API Key
    localStorage.setItem('geodb_api_key', apiKey);
    
    // Configurar la instancia de GeoDB si existe
    if (window.geoDBAPI) {
      window.geoDBAPI.configurar(apiKey);
    }
    
    // Actualizar estado
    actualizarEstadoSistema();
    
    // Mostrar confirmación
    mostrarNotificacion('Sistema configurado en modo GeoDB Cities', 'success');
    
    // Recargar selectores si están visibles
    recargarSelectoresUbicacion();
    
  } catch (error) {
    console.error('Error verificando API Key:', error);
    alert('Error al verificar la API Key. Verifica que sea válida y tenga los permisos necesarios.');
  }
}

// Actualizar estado del sistema actual
function actualizarEstadoSistema() {
  const contenedor = document.getElementById('estadoSistemaActual');
  if (!contenedor) return;
  
  let estadoHtml = '';
  
  if (window.sistemaUbicaciones) {
    const info = window.sistemaUbicaciones.obtenerInformacionSistema();
    
    if (info.modo === 'geodb') {
      estadoHtml = `
        <strong><i class="fas fa-cloud text-info"></i> GeoDB Cities API</strong><br>
        <small>API Key: ${info.apiKeyConfigurada ? 'Configurada' : 'No configurada'}</small><br>
        <small>Estado: ${info.geoDBDisponible ? 'Disponible' : 'No disponible'}</small>
      `;
    } else {
      estadoHtml = `
        <strong><i class="fas fa-database text-success"></i> Sistema Local</strong><br>
        <small>Usando datos predefinidos de Perú</small>
      `;
    }
  } else {
    estadoHtml = `
      <strong><i class="fas fa-exclamation-triangle text-warning"></i> Sistema por defecto</strong><br>
      <small>Sistema de ubicaciones no inicializado completamente</small>
    `;
  }
  
  contenedor.innerHTML = estadoHtml;
}

// Recargar selectores de ubicación si están visibles
function recargarSelectoresUbicacion() {
  const formRuta = document.getElementById('formRuta');
  if (formRuta && formRuta.style.display !== 'none') {
    // Limpiar selectores
    ['regionOrigen', 'provinciaOrigen', 'ciudadOrigen', 'regionDestino', 'provinciaDestino', 'ciudadDestino'].forEach(id => {
      const select = document.getElementById(id);
      if (select) {
        if (id.includes('region')) {
          select.innerHTML = '<option value="">Seleccionar Región</option>';
          cargarRegionesUnificado(id);
        } else {
          select.innerHTML = `<option value="">Seleccionar ${id.includes('provincia') ? 'Provincia' : 'Ciudad'}</option>`;
        }
      }
    });
  }
}

// Mostrar notificación temporal
function mostrarNotificacion(mensaje, tipo = 'info') {
  const notificacion = document.createElement('div');
  notificacion.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
  notificacion.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  notificacion.innerHTML = `
    ${mensaje}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(notificacion);
  
  // Auto-remover después de 3 segundos
  setTimeout(() => {
    if (notificacion.parentNode) {
      notificacion.remove();
    }
  }, 3000);
}

// ========== FUNCIONES DE GESTIÓN DE USUARIOS ==========

// Cambiar rol de usuario
async function cambiarRoleUsuario(userId, roleActual) {
  const nuevosRoles = ['usuario', 'trabajador', 'admin'];
  const rolesTexto = {
    usuario: 'Usuario',
    trabajador: 'Trabajador',
    admin: 'Administrador'
  };
  let opcionesHtml = '';
  nuevosRoles.forEach(role => {
    const selected = role === roleActual ? 'selected' : '';
    opcionesHtml += `<option value="${role}" ${selected}>${rolesTexto[role]}</option>`;
  });
  
  const modalHtml = `
    <div class="modal fade" id="modalCambiarRol" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="fas fa-user-cog"></i> Cambiar Rol de Usuario
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Nuevo Rol:</label>
              <select class="form-control" id="nuevoRol">
                ${opcionesHtml}
              </select>
            </div>
            <div class="alert alert-warning">
              <small>
                <strong>Nota:</strong> Cambiar el rol afectará los permisos del usuario inmediatamente.
              </small>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Cancelar
            </button>
            <button type="button" class="btn btn-primary" onclick="confirmarCambioRol(${userId})">
              <i class="fas fa-save"></i> Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Remover modal anterior si existe
  const modalAnterior = document.getElementById('modalCambiarRol');
  if (modalAnterior) {
    modalAnterior.remove();
  }
  
  // Agregar modal al DOM
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Mostrar modal
  const modal = new bootstrap.Modal(document.getElementById('modalCambiarRol'));
  modal.show();
}

// Confirmar cambio de rol
async function confirmarCambioRol(userId) {
  const nuevoRol = document.getElementById('nuevoRol').value;
  
  try {
    const response = await fetch('http://localhost:8000/backend_php/api/users.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: userId,
        accion: 'cambiar_rol',
        rol: nuevoRol
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalCambiarRol'));
      modal.hide();
      
      // Mostrar confirmación
      mostrarNotificacion(`Rol cambiado exitosamente a ${nuevoRol}`, 'success');
      
      // Recargar usuarios
      cargarUsuarios();
    } else {
      throw new Error(result.message || 'Error al cambiar rol');
    }
  } catch (error) {
    console.error('Error cambiando rol:', error);
    alert('Error al cambiar rol: ' + error.message);
  }
}

// Activar/Desactivar usuario
async function toggleActivarUsuario(userId, activar) {
  const accion = activar ? 'activar' : 'desactivar';
  const mensaje = activar ? 'activar' : 'desactivar';
  
  if (!confirm(`¿Estás seguro de que quieres ${mensaje} este usuario?`)) {
    return;
  }
  
  try {
    const response = await fetch('http://localhost:8000/backend_php/api/users.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: userId,
        accion: 'toggle_activo',
        activo: activar
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Mostrar confirmación
      mostrarNotificacion(`Usuario ${mensaje}do exitosamente`, 'success');
      
      // Recargar usuarios
      cargarUsuarios();
    } else {
      throw new Error(result.message || `Error al ${mensaje} usuario`);
    }
  } catch (error) {
    console.error(`Error ${mensaje}ndo usuario:`, error);
    alert(`Error al ${mensaje} usuario: ` + error.message);
  }
}

// Mostrar usuarios filtrados (función auxiliar para paginación)
function mostrarUsuarios(usuariosFiltrados) {
  const usuariosPagina = obtenerUsuariosPagina(usuariosFiltrados);
  const tbody = document.getElementById('tablaUsuarios');
  
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  usuariosPagina.forEach(usuario => {
    tbody.innerHTML += `
      <tr>
        <td>${usuario.id}</td>
        <td>
          <div>
            <strong>${usuario.nombre_completo || usuario.email}</strong>
            ${usuario.nombre_completo ? `<br><small class="text-muted">${usuario.email}</small>` : ''}
          </div>
        </td>
        <td>
          <span class="badge bg-${usuario.rol === 'admin' ? 'danger' : usuario.rol === 'trabajador' ? 'warning' : 'primary'}">
            ${usuario.rol || 'usuario'}
          </span>
          ${usuario.is_active !== undefined ? `
            <br><span class="badge bg-${usuario.is_active ? 'success' : 'secondary'} mt-1">
              ${usuario.is_active ? 'Activo' : 'Inactivo'}
            </span>
          ` : ''}
        </td>
        <td>
          <small class="text-muted">
            ${usuario.created_at ? new Date(usuario.created_at).toLocaleDateString('es-ES') : 'No disponible'}
          </small>
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" onclick="cambiarRolUsuario(${usuario.id}, '${usuario.rol || 'usuario'}')" 
                    title="Cambiar rol">
              <i class="fas fa-user-cog"></i>
            </button>
            ${(usuario.rol || 'usuario') !== 'admin' ? `
              <button class="btn btn-outline-${usuario.is_active ? 'danger' : 'success'}" 
                      onclick="toggleActivarUsuario(${usuario.id}, ${!usuario.is_active})" 
                      title="${usuario.is_active ? 'Desactivar' : 'Activar'} usuario">
                <i class="fas fa-user-${usuario.is_active ? 'times' : 'check'}"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  });
  
  generarPaginacionUsuarios();
}

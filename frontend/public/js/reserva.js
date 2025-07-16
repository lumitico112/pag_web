console.log('JS reserva.js cargado correctamente');
// reserva.js - Lógica de reserva separada desde reserva_5.html

// Variables globales
let rutaSeleccionada = null;
let precioBaseRuta = 0;
let tiposBus = {
  'Económico': 80,
  'Ejecutivo': 120,
  'VIP': 150
};

// Cargar rutas al iniciar
// Solo cargar rutas disponibles, nunca mostrar pago directo
document.addEventListener('DOMContentLoaded', function() {
  cargarRutasDisponibles();
  configurarEventos();
});

// Configurar eventos
function configurarEventos() {
  // Si hay ruta seleccionada por parámetro, solo mostrar info de la ruta seleccionada
  const urlParams = new URLSearchParams(window.location.search);
  const rutaId = urlParams.get('ruta');
  if (rutaId) {
    // Ocultar el listado de rutas y los pasos tradicionales
    document.getElementById('rutas-disponibles').style.display = 'none';
    document.getElementById('paso-bus').style.display = 'none';
    document.getElementById('paso-pasajeros').style.display = 'none';
    document.getElementById('paso-confirmacion').style.display = 'none';
    // Mostrar solo el paso de ruta
    document.getElementById('paso-ruta').style.display = 'block';
    // Cambiar el título del paso 1
    document.querySelector('#paso-ruta h5').innerHTML = '<i class="fas fa-route"></i> Paso 1: Detalle de tu ruta seleccionada';
    // Limpiar info previa
    document.getElementById('info-ruta-seleccionada').innerHTML = '<div class="text-center text-secondary py-4"><span class="spinner-border"></span> Cargando información de la ruta...</div>';
    document.getElementById('ruta-seleccionada').style.display = 'block';
    // Cargar y mostrar la info de la ruta seleccionada, luego mostrar el botón
    seleccionarRuta(rutaId, false).then(() => {
      // Si no se cargó la ruta, mostrar error
      if (!rutaSeleccionada) {
        document.getElementById('info-ruta-seleccionada').innerHTML = '<div class="alert alert-danger text-center">No se pudo cargar la información de la ruta seleccionada.</div>';
        return;
      }
      // Eliminar botones de continuar y mostrar solo botón de registrar y pagar
      const btns = document.querySelectorAll('#paso-ruta button');
      btns.forEach(btn => btn.style.display = 'none');
      if (!document.getElementById('btn-registrar-pagar')) {
        const btnRegistrar = document.createElement('button');
        btnRegistrar.id = 'btn-registrar-pagar';
        btnRegistrar.className = 'btn btn-success mt-4 w-100 fs-5';
        btnRegistrar.innerHTML = '<i class="fas fa-credit-card"></i> Procesar y Pagar';
        btnRegistrar.onclick = procesarReservaDirecto;
        document.getElementById('ruta-seleccionada').appendChild(btnRegistrar);
      }
    });
    return;
  }
  // Si no hay ruta por parámetro, flujo normal
  document.getElementById('cantidad-pasajeros').addEventListener('input', calcularTotal);
  document.getElementById('tipo-bus').addEventListener('change', calcularTotal);
}

// Cargar rutas disponibles
async function cargarRutasDisponibles() {
  const contenedor = document.getElementById('rutas-disponibles');
  try {
    const response = await fetch(`http://localhost:8000/backend_php/api/rutas.php?v=${new Date().getTime()}`);
    const data = await response.json();
    const rutas = Array.isArray(data) ? data : (data.rutas || []);
    const rutasDisponibles = rutas.filter(ruta => 
      ruta.estado === 'activo' && 
      (ruta.disponibles || ruta.capacidad_pasajeros) > 0 &&
      (!ruta.fecha_salida || new Date(ruta.fecha_salida) >= new Date())
    );
    if (rutasDisponibles.length === 0) {
      contenedor.innerHTML = `
        <div class="col-12">
          <div class="alert alert-warning text-center">
            <i class="fas fa-exclamation-triangle"></i>
            <h5>No hay rutas disponibles</h5>
            <p>Actualmente no hay rutas con disponibilidad para reserva.</p>
            <a href="index.html" class="btn btn-primary">Volver al Inicio</a>
          </div>
        </div>
      `;
      return;
    }
    contenedor.innerHTML = '';
    for (const ruta of rutasDisponibles) {
      const imagenInfo = await obtenerImagenRuta(ruta.origen, ruta.destino);
      const tarjetaRuta = crearTarjetaRutaReserva(ruta, imagenInfo);
      contenedor.innerHTML += tarjetaRuta;
    }
  } catch (error) {
    console.error('Error cargando rutas:', error);
    contenedor.innerHTML = `
      <div class="col-12">
        <div class="alert alert-danger text-center">
          <i class="fas fa-exclamation-circle"></i>
          <h5>Error al cargar rutas</h5>
          <p>No se pudieron cargar las rutas disponibles.</p>
          <button class="btn btn-outline-danger" onclick="cargarRutasDisponibles()">
            <i class="fas fa-redo"></i> Reintentar
          </button>
        </div>
      </div>
    `;
  }
}

// Obtener imagen para la ruta
async function obtenerImagenRuta(origen, destino) {
  try {
    const response = await fetch(`http://localhost:8000/backend_php/api/imagenes.php?ruta=${origen}-${destino}&v=${new Date().getTime()}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Error obteniendo imagen:', error);
  }
  return {
    imagen: 'Lima-Trujillo.jpg',
    url: '../img/rutas/Lima-Trujillo.jpg'
  };
}

// Crear tarjeta de ruta para reserva
function crearTarjetaRutaReserva(ruta, imagenInfo) {
  const fechaSalida = ruta.fecha_salida ? new Date(ruta.fecha_salida).toLocaleDateString('es-ES') : 'Por confirmar';
  const horaSalida = ruta.hora_salida || 'Por confirmar';
  const disponibles = ruta.disponibles || ruta.capacidad_pasajeros || 0;
  return `
    <div class="col-md-6 mb-3">
      <div class="card h-100 cursor-pointer ruta-card" onclick="seleccionarRuta(${ruta.id})" data-ruta-id="${ruta.id}">
        <div class="position-relative">
          <img src="${imagenInfo.url}" class="card-img-top" alt="Ruta" style="height: 150px; object-fit: cover;">
          <div class="position-absolute top-0 end-0 m-2">
            <span class="badge bg-success">${disponibles} disponibles</span>
          </div>
        </div>
        <div class="card-body">
          <h6 class="card-title text-primary">
            <i class="fas fa-route"></i> ${ruta.origen} → ${ruta.destino}
          </h6>
          <div class="row text-center small">
            <div class="col-6">
              <strong>Fecha:</strong><br>${fechaSalida}
            </div>
            <div class="col-6">
              <strong>Hora:</strong><br>${horaSalida}
            </div>
          </div>
          ${ruta.duracion ? `<p class="text-center mt-2 mb-1"><i class="fas fa-clock"></i> ${ruta.duracion}</p>` : ''}
          <div class="text-center">
            <span class="badge bg-primary fs-6">Desde S/ ${parseFloat(ruta.precio).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Seleccionar ruta
async function seleccionarRuta(rutaId, precarga = false) {
  try {
    console.log('Intentando cargar ruta con ID:', rutaId);
    const response = await fetch(`http://localhost:8000/backend_php/api/rutas.php?id=${rutaId}`);
    const rutaData = await response.json();
    console.log('Respuesta backend ruta:', rutaData);
    let rutaObj = null;
    if (Array.isArray(rutaData) && rutaData.length > 0) {
      rutaObj = rutaData[0];
    } else if (rutaData && typeof rutaData === 'object' && rutaData.id) {
      rutaObj = rutaData;
    } else if (rutaData && typeof rutaData === 'object' && rutaData.ruta && rutaData.ruta.id) {
      rutaObj = rutaData.ruta;
    }
    if (rutaObj) {
      rutaSeleccionada = rutaObj;
      precioBaseRuta = parseFloat(rutaSeleccionada.precio) || 0;
      const infoRuta = document.getElementById('info-ruta-seleccionada');
      const fechaSalida = rutaSeleccionada.fecha_salida ? new Date(rutaSeleccionada.fecha_salida).toLocaleDateString('es-ES') : 'Por confirmar';
      const horaSalida = rutaSeleccionada.hora_salida || 'Por confirmar';
      infoRuta.innerHTML = `
        <div class="row">
          <div class="col-md-8">
            <strong>${rutaSeleccionada.origen} → ${rutaSeleccionada.destino}</strong><br>
            <small>📅 ${fechaSalida} | ⏰ ${horaSalida}</small><br>
            ${rutaSeleccionada.duracion ? `<small>⏱️ Duración: ${rutaSeleccionada.duracion}</small>` : ''}
          </div>
          <div class="col-md-4 text-end">
            <span class="badge bg-success">${rutaSeleccionada.disponibles || rutaSeleccionada.capacidad_pasajeros || 0} disponibles</span><br>
            <strong class="fs-4 text-primary">S/ ${precioBaseRuta.toFixed(2)}</strong>
          </div>
        </div>
      `;
      document.getElementById('ruta-id').value = rutaSeleccionada.id;
      document.getElementById('ruta-seleccionada').style.display = 'block';
      if (precarga) {
        // Mostrar solo el botón de continuar a tipo de bus
        const btns = document.querySelectorAll('#paso-ruta button');
        btns.forEach(btn => btn.style.display = 'none');
        if (!document.getElementById('btn-continuar-comprar')) {
          const btnContinuar = document.createElement('button');
          btnContinuar.id = 'btn-continuar-comprar';
          btnContinuar.className = 'btn btn-primary mt-3';
          btnContinuar.innerHTML = 'Continuar <i class="fas fa-arrow-right"></i>';
          btnContinuar.onclick = continuarAPasajeros;
          document.getElementById('ruta-seleccionada').appendChild(btnContinuar);
        }
      }
    } else {
      rutaSeleccionada = null;
    }
  } catch (error) {
    console.error('Error seleccionando ruta:', error);
    rutaSeleccionada = null;
  }
}

// Continuar a selección de pasajeros
function continuarAPasajeros() {
  if (!rutaSeleccionada) {
    alert('Por favor selecciona una ruta primero');
    return;
  }
  document.getElementById('paso-ruta').style.display = 'none';
  document.getElementById('paso-bus').style.display = 'block';
  document.getElementById('ruta-id').value = rutaSeleccionada.id;
}

// Calcular total
function calcularTotal() {
  const cantidad = parseInt(document.getElementById('cantidad-pasajeros').value) || 0;
  const tipoBus = document.getElementById('tipo-bus').value;
  if (cantidad > 0 && tipoBus && rutaSeleccionada) {
    const precioBus = tiposBus[tipoBus] || 0;
    const total = (precioBaseRuta + precioBus) * cantidad;
    document.getElementById('monto-total').textContent = `S/ ${total.toFixed(2)}`;
    document.getElementById('precio-total').style.display = 'block';
    document.getElementById('btn-continuar-datos').disabled = false;
    const disponibles = rutaSeleccionada.disponibles || rutaSeleccionada.capacidad_pasajeros || 0;
    if (cantidad > disponibles) {
      alert(`Solo hay ${disponibles} asientos disponibles para esta ruta.`);
      document.getElementById('cantidad-pasajeros').value = disponibles;
      calcularTotal();
    }
  } else {
    document.getElementById('precio-total').style.display = 'none';
    document.getElementById('btn-continuar-datos').disabled = true;
  }
}

// Continuar a datos de pasajeros
function continuarADatos() {
  const cantidad = parseInt(document.getElementById('cantidad-pasajeros').value);
  if (cantidad <= 0) {
    alert('Por favor ingresa el número de pasajeros');
    return;
  }
  document.getElementById('paso-bus').style.display = 'none';
  document.getElementById('paso-pasajeros').style.display = 'block';
  generarFormulariosPasajeros(cantidad);
}

// Generar formularios de pasajeros
function generarFormulariosPasajeros(cantidad) {
  const contenedor = document.getElementById('pasajeros-container');
  contenedor.innerHTML = '';
  for (let i = 0; i < cantidad; i++) {
    contenedor.innerHTML += `
      <fieldset class="border p-3 mb-3 rounded">
        <legend class="fs-6 text-primary">Pasajero ${i + 1}</legend>
        <div class="row">
          <div class="col-md-6 mb-2">
            <label class="form-label">Nombre completo *</label>
            <input type="text" name="nombres[]" class="form-control" required>
          </div>
          <div class="col-md-6 mb-2">
            <label class="form-label">DNI/Pasaporte *</label>
            <input type="text" name="documentos[]" class="form-control" pattern="[0-9]{8}" maxlength="8" required>
          </div>
          <div class="col-md-6 mb-2">
            <label class="form-label">Correo electrónico *</label>
            <input type="email" name="correos[]" class="form-control" required>
          </div>
          <div class="col-md-6 mb-2">
            <label class="form-label">Teléfono</label>
            <input type="tel" name="telefonos[]" class="form-control">
          </div>
        </div>
      </fieldset>
    `;
  }
}

// Funciones de navegación
function volverASeleccionRuta() {
  document.getElementById('paso-bus').style.display = 'none';
  document.getElementById('paso-ruta').style.display = 'block';
}

function volverATipoBus() {
  document.getElementById('paso-pasajeros').style.display = 'none';
  document.getElementById('paso-bus').style.display = 'block';
}

// Procesar reserva
async function procesarReserva() {
  const nombres = document.querySelectorAll('input[name="nombres[]"]');
  const documentos = document.querySelectorAll('input[name="documentos[]"]');
  const correos = document.querySelectorAll('input[name="correos[]"]');
  let valido = true;
  nombres.forEach((input, index) => {
    if (!input.value.trim()) {
      valido = false;
      input.focus();
    }
  });
  documentos.forEach((input, index) => {
    if (!input.value.trim() || input.value.length !== 8) {
      valido = false;
      input.focus();
    }
  });
  correos.forEach((input, index) => {
    if (!input.value.trim() || !input.value.includes('@')) {
      valido = false;
      input.focus();
    }
  });
  if (!valido) {
    alert('Por favor completa todos los campos obligatorios correctamente');
    return;
  }
  const btnProcesar = document.getElementById('btn-procesar');
  const textoOriginal = btnProcesar.innerHTML;
  btnProcesar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';
  btnProcesar.disabled = true;
  const reservaData = {
    ruta_id: rutaSeleccionada.id,
    tipo_bus: document.getElementById('tipo-bus').value,
    cantidad_pasajeros: parseInt(document.getElementById('cantidad-pasajeros').value),
    pasajeros: []
  };
  nombres.forEach((input, index) => {
    reservaData.pasajeros.push({
      nombre: nombres[index].value.trim(),
      documento: documentos[index].value.trim(),
      correo: correos[index].value.trim(),
      telefono: document.querySelectorAll('input[name="telefonos[]"]')[index]?.value.trim() || ''
    });
  });
  // Obtener usuario_id de la sesión
  let usuario_id = null;
  if (window.AuthSystem && typeof window.AuthSystem.getUserData === 'function') {
    const userData = window.AuthSystem.getUserData();
    if (userData && userData.id) usuario_id = userData.id;
  } else if (localStorage.getItem('utptravel_session')) {
    try {
      const session = JSON.parse(localStorage.getItem('utptravel_session'));
      if (session && session.usuario_id) usuario_id = session.usuario_id;
    } catch(e) {}
  }
  if (usuario_id) reservaData.usuario_id = usuario_id;
  // DEBUG: Mostrar el payload antes de enviar
  console.log('Payload reservaData:', reservaData);
  try {
    const response = await fetch('http://localhost:8000/backend_php/api/reservas.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservaData)
    });
    const resultado = await response.json();
    console.log('Respuesta backend:', resultado);
    if (!response.ok) {
      alert('Error HTTP: ' + response.status + ' - ' + response.statusText);
      throw new Error('HTTP error: ' + response.status);
    }
    if (!resultado.success) {
      alert('Error backend: ' + (resultado.error || JSON.stringify(resultado)));
      throw new Error(resultado.error || 'Error desconocido en backend');
    }
    document.getElementById('paso-pasajeros').style.display = 'none';
    document.getElementById('paso-confirmacion').style.display = 'block';
    const detalleConfirmacion = document.getElementById('detalle-confirmacion');
    const fechaSalida = rutaSeleccionada.fecha_salida ? 
      new Date(rutaSeleccionada.fecha_salida).toLocaleDateString('es-ES') : 'Por confirmar';
    detalleConfirmacion.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5><i class="fas fa-ticket-alt"></i> Detalles de tu Reserva</h5>
          <div class="row">
            <div class="col-md-6">
              <p><strong>Código de Reserva:</strong> <span class="text-primary">${resultado.codigo_reserva}</span></p>
              <p><strong>Ruta:</strong> ${rutaSeleccionada.origen} → ${rutaSeleccionada.destino}</p>
              <p><strong>Fecha de Viaje:</strong> ${fechaSalida}</p>
              <p><strong>Hora de Salida:</strong> ${rutaSeleccionada.hora_salida || 'Por confirmar'}</p>
            </div>
            <div class="col-md-6">
              <p><strong>Tipo de Bus:</strong> ${reservaData.tipo_bus}</p>
              <p><strong>Pasajeros:</strong> ${reservaData.cantidad_pasajeros}</p>
              <p><strong>Total Pagado:</strong> <span class="text-success fs-5">S/ ${resultado.precio_total.toFixed(2)}</span></p>
            </div>
          </div>
          <div class="alert alert-info mt-3">
            <i class="fas fa-info-circle"></i>
            <strong>Importante:</strong> Guarda tu código de reserva <strong>${resultado.codigo_reserva}</strong>. 
            Lo necesitarás el día del viaje junto con tu documento de identidad.
          </div>
        </div>
      </div>
    `;
    // Mostrar animación de carga mientras se genera el PDF real
    detalleConfirmacion.innerHTML += `
      <div id="pdf-loading" class="text-center mt-4">
        <div class="spinner-border text-primary" role="status" style="width: 4rem; height: 4rem;">
          <span class="visually-hidden">Generando comprobante PDF...</span>
        </div>
        <p class="mt-3 fs-5">Generando comprobante electrónico...</p>
      </div>
    `;
    // Llamar automáticamente al PDF real y mostrarlo en un iframe
    const pdfUrl = `http://localhost:8000/backend_php/api/pdf-reserva.php?reserva_id=${resultado.reserva_id}`;
    fetch(pdfUrl)
      .then(resp => resp.json())
      .then(data => {
        if (data && data.pdf_url) {
          setTimeout(() => { // Simular tiempo de generación
            const loadingDiv = document.getElementById('pdf-loading');
            if (loadingDiv) loadingDiv.remove();
            // Mostrar el comprobante en un iframe (sin quitar el &format=html)
            detalleConfirmacion.innerHTML += `
              <div class="mt-3">
                <iframe src="${data.pdf_url}" style="width:100%;height:700px;border:1px solid #ccc;"></iframe>
                <div class='text-center mt-2'>
                  <a href="${data.pdf_url}" target="_blank" class="btn btn-outline-primary"><i class="fas fa-download"></i> Descargar PDF</a>
                </div>
              </div>
            `;
          }, 1200);
        } else {
          throw new Error('No se pudo generar el PDF');
        }
      })
      .catch(() => {
        const loadingDiv = document.getElementById('pdf-loading');
        if (loadingDiv) loadingDiv.innerHTML = '<div class="alert alert-danger">No se pudo generar el comprobante PDF.</div>';
      });
    console.log('Reserva confirmada:', resultado);
  } catch (error) {
    console.error('Error procesando reserva:', error);
    alert('Error al procesar la reserva: ' + error.message);
    btnProcesar.innerHTML = textoOriginal;
    btnProcesar.disabled = false;
  }
}

// Botón temporal para limpiar localStorage (solo para pruebas)
document.addEventListener('DOMContentLoaded', function() {
  if (!document.getElementById('btn-limpiar-localstorage')) {
    const btnLimpiar = document.createElement('button');
    btnLimpiar.id = 'btn-limpiar-localstorage';
    btnLimpiar.className = 'btn btn-danger mt-2';
    btnLimpiar.innerHTML = '<i class="fas fa-trash"></i> Limpiar localStorage (debug)';
    btnLimpiar.onclick = function() {
      if (confirm('¿Seguro que deseas limpiar el localStorage? Esto cerrará tu sesión.')) {
        localStorage.clear();
        alert('localStorage limpiado. Recarga la página.');
        location.reload();
      }
    };
    // Lo agregamos al final del body para pruebas
    document.body.appendChild(btnLimpiar);
  }
});

// Procesar reserva directo (sin pedir más datos)
async function procesarReservaDirecto() {
  const btnRegistrar = document.getElementById('btn-registrar-pagar');
  const textoOriginal = btnRegistrar.innerHTML;
  btnRegistrar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';
  btnRegistrar.disabled = true;
  // Obtener todos los datos posibles del usuario
  const datosUsuario = obtenerDatosUsuario();
  const { usuario_id, nombre, documento, correo, telefono, origenes } = datosUsuario;
  console.log('[Reserva] Datos recogidos:', {origenes, usuario_id, nombre, documento, correo, telefono});
  // Permitir la reserva aunque todos los datos estén vacíos, pero mostrar advertencia fuerte
  if (!nombre && !documento && !correo && !telefono) {
    alert('Advertencia: No se detectaron datos de usuario. La reserva se realizará sin datos personales.');
  } else if (!nombre || !documento || !correo || !telefono) {
    let faltantes = [];
    if (!nombre) faltantes.push('nombre');
    if (!documento) faltantes.push('DNI');
    if (!correo) faltantes.push('correo');
    if (!telefono) faltantes.push('teléfono');
    alert('Advertencia: Faltan los siguientes datos en tu perfil: ' + faltantes.join(', ') + '. La reserva se realizará con los datos disponibles.');
  }
  const reservaData = {
    ruta_id: rutaSeleccionada.id,
    tipo_bus: rutaSeleccionada.tipo_bus || 'Económico',
    cantidad_pasajeros: 1,
    pasajeros: [
      {
        nombre,
        documento,
        correo,
        telefono
      }
    ]
  };
  if (usuario_id) reservaData.usuario_id = usuario_id;
  // Guardar/actualizar datos en AuthSystem antes de reservar
  if (window.auth && typeof window.auth.setUserData === 'function') {
    window.auth.setUserData({
      usuario_id,
      nombre,
      dni: documento,
      email: correo,
      telefono
    });
  }
  try {
    const response = await fetch('http://localhost:8000/backend_php/api/reservas.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservaData)
    });
    const resultado = await response.json();
    if (!response.ok || !resultado.success) throw new Error(resultado.error || 'Error en backend');
    document.getElementById('paso-ruta').style.display = 'none';
    document.getElementById('paso-confirmacion').style.display = 'block';
    const detalleConfirmacion = document.getElementById('detalle-confirmacion');
    const fechaSalida = rutaSeleccionada.fecha_salida ? new Date(rutaSeleccionada.fecha_salida).toLocaleDateString('es-ES') : 'Por confirmar';
    detalleConfirmacion.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h5><i class="fas fa-ticket-alt"></i> Detalles de tu Reserva</h5>
          <div class="row">
            <div class="col-md-6">
              <p><strong>Código de Reserva:</strong> <span class="text-primary">${resultado.codigo_reserva}</span></p>
              <p><strong>Ruta:</strong> ${rutaSeleccionada.origen} → ${rutaSeleccionada.destino}</p>
              <p><strong>Fecha de Viaje:</strong> ${fechaSalida}</p>
              <p><strong>Hora de Salida:</strong> ${rutaSeleccionada.hora_salida || 'Por confirmar'}</p>
            </div>
            <div class="col-md-6">
              <p><strong>Tipo de Bus:</strong> ${reservaData.tipo_bus}</p>
              <p><strong>Pasajeros:</strong> ${reservaData.cantidad_pasajeros}</p>
              <p><strong>Total Pagado:</strong> <span class="text-success fs-5">S/ ${resultado.precio_total.toFixed(2)}</span></p>
            </div>
          </div>
          <div class="alert alert-info mt-3">
            <i class="fas fa-info-circle"></i>
            <strong>Importante:</strong> Guarda tu código de reserva <strong>${resultado.codigo_reserva}</strong>.
            Lo necesitarás el día del viaje junto con tu documento de identidad.
          </div>
        </div>
      </div>
    `;
    // Mostrar animación de carga mientras se genera el PDF real
    detalleConfirmacion.innerHTML += `
      <div id="pdf-loading" class="text-center mt-4">
        <div class="spinner-border text-primary" role="status" style="width: 4rem; height: 4rem;">
          <span class="visually-hidden">Generando comprobante PDF...</span>
        </div>
        <p class="mt-3 fs-5">Generando comprobante electrónico...</p>
      </div>
    `;
    // Llamar automáticamente al PDF real y mostrarlo en un iframe
    const pdfUrl = `http://localhost:8000/backend_php/api/pdf-reserva.php?reserva_id=${resultado.reserva_id}`;
    fetch(pdfUrl)
      .then(resp => resp.json())
      .then(data => {
        if (data && data.pdf_url) {
          setTimeout(() => {
            const loadingDiv = document.getElementById('pdf-loading');
            if (loadingDiv) loadingDiv.remove();
            // Mostrar el comprobante en un iframe (sin quitar el &format=html)
            detalleConfirmacion.innerHTML += `
              <div class="mt-3">
                <iframe src="${data.pdf_url}" style="width:100%;height:700px;border:1px solid #ccc;"></iframe>
                <div class='text-center mt-2'>
                  <a href="${data.pdf_url}" target="_blank" class="btn btn-outline-primary"><i class="fas fa-download"></i> Descargar PDF</a>
                </div>
              </div>
            `;
          }, 1200);
        } else {
          throw new Error('No se pudo generar el PDF');
        }
      })
      .catch(() => {
        const loadingDiv = document.getElementById('pdf-loading');
        if (loadingDiv) loadingDiv.innerHTML = '<div class="alert alert-danger">No se pudo generar el comprobante PDF.</div>';
      });
  } catch (error) {
    alert('Error al procesar la reserva: ' + error.message);
    btnRegistrar.innerHTML = textoOriginal;
    btnRegistrar.disabled = false;
  }
}

// Función centralizada para obtener datos del usuario
function obtenerDatosUsuario() {
  console.log('[obtenerDatosUsuario] window.auth:', window.auth);
  if (window.auth && typeof auth.getUserData === 'function') {
    const user = auth.getUserData() || {};
    console.log('[obtenerDatosUsuario] auth.getUserData():', user);
    return {
      usuario_id: user.usuario_id,
      nombre: user.nombre,
      documento: user.dni,
      correo: user.email,
      telefono: user.telefono,
      origenes: ['auth']
    };
  }
  // DEBUG extra: mostrar si existe window.AuthSystem
  console.log('[obtenerDatosUsuario] window.AuthSystem:', window.AuthSystem);
  // DEBUG extra: mostrar localStorage utptravel_session
  try {
    const session = JSON.parse(localStorage.getItem('utptravel_session'));
    console.log('[obtenerDatosUsuario] localStorage utptravel_session:', session);
  } catch(e) {
    console.log('[obtenerDatosUsuario] Error parseando localStorage:', e);
  }
  return {
    usuario_id: null,
    nombre: '',
    documento: '',
    correo: '',
    telefono: '',
    origenes: []
  };
}

// DEBUG: Forzar asignación global después de DOMContentLoaded
window.addEventListener('DOMContentLoaded', function() {
  window.procesarReserva = function() {
    console.log('Click en Procesar Reserva (DOMContentLoaded)');
    return procesarReserva.apply(this, arguments);
  };
  window.continuarADatos = continuarADatos;
  window.continuarAPasajeros = continuarAPasajeros;
  window.volverASeleccionRuta = volverASeleccionRuta;
  window.volverATipoBus = volverATipoBus;
});

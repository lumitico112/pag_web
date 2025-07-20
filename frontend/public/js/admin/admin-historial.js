// Admin Historial - Gestión del historial de viajes para administradores

class AdminHistorial {
  constructor() {
    this.rutasConcluidas = [];
    this.rutasActivas = [];
    this.rutasVencidas = [];
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Add any specific event listeners for historial section
  }

  async cargarHistorial() {
    try {
      console.log('[HISTORIAL] Cargando historial completo...');
      await Promise.all([
        this.cargarRutasActivas(),
        this.cargarRutasConcluidas(),
        this.cargarRutasVencidas()
      ]);
      this.actualizarContadores();
      console.log('[HISTORIAL] Historial cargado completamente');
    } catch (error) {
      console.error('Error loading historial:', error);
      this.showAlert('Error al cargar el historial', 'danger');
    }
  }

  async cargarRutasActivas() {
    try {
      console.log('[HISTORIAL] Cargando rutas activas...');
      const response = await fetch(`${API_BASE_URL}/rutas.php`);
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error('Error parsing JSON rutas activas:', error);
        data = { success: false, rutas: [] };
      }
      
      // Obtener rutas del formato correcto
      let todasLasRutas = [];
      if (data && data.success && Array.isArray(data.rutas)) {
        todasLasRutas = data.rutas;
      } else if (Array.isArray(data)) {
        todasLasRutas = data;
      }
      
      console.log('[HISTORIAL] Total rutas en sistema:', todasLasRutas.length);
      
      // Filtrar rutas activas (con fecha futura o sin fecha pero estado activo)
      const ahora = new Date();
      this.rutasActivas = todasLasRutas.filter(ruta => {
        // Si tiene fecha de salida, verificar que sea futura
        if (ruta.fecha_salida) {
          const fechaSalida = new Date(ruta.fecha_salida);
          return fechaSalida >= ahora && ruta.estado === 'activo';
        }
        // Si no tiene fecha, considerarla activa si el estado es activo
        return ruta.estado === 'activo';
      });
      
      this.renderRutasActivas();
      console.log('[HISTORIAL] Rutas activas cargadas:', this.rutasActivas.length, 'de', todasLasRutas.length, 'total');
    } catch (error) {
      console.error('Error loading rutas activas:', error);
      this.rutasActivas = [];
      this.renderRutasActivas();
    }
  }

  async cargarRutasConcluidas() {
    try {
      console.log('[HISTORIAL] Cargando rutas concluidas...');
      const response = await fetch(`${API_BASE_URL}/rutas-concluidas.php`);
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error('Error parsing JSON rutas concluidas:', error);
        data = [];
      }
      
      // Asignar rutas según formato recibido
      if (data && data.success && Array.isArray(data.rutas)) {
        this.rutasConcluidas = data.rutas;
      } else if (Array.isArray(data)) {
        this.rutasConcluidas = data;
      } else {
        this.rutasConcluidas = [];
      }
      
      this.renderRutasConcluidas();
      console.log('[HISTORIAL] Rutas concluidas cargadas:', this.rutasConcluidas.length);
    } catch (error) {
      console.error('Error loading rutas concluidas:', error);
      this.rutasConcluidas = [];
      this.renderRutasConcluidas();
    }
  }

  async cargarRutasVencidas() {
    try {
      console.log('[HISTORIAL] Cargando rutas vencidas...');
      const response = await fetch(`${API_BASE_URL}/rutas.php`);
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error('Error parsing JSON rutas vencidas:', error);
        data = { success: false, rutas: [] };
      }
      
      // Obtener rutas del formato correcto
      let todasLasRutas = [];
      if (data && data.success && Array.isArray(data.rutas)) {
        todasLasRutas = data.rutas;
      } else if (Array.isArray(data)) {
        todasLasRutas = data;
      }
      
      // Filtrar solo rutas vencidas (con fecha pasada)
      const ahora = new Date();
      this.rutasVencidas = todasLasRutas.filter(ruta => {
        if (ruta.fecha_salida) {
          const fechaSalida = new Date(ruta.fecha_salida);
          return fechaSalida < ahora && ruta.estado === 'activo';
        }
        return false; // Si no tiene fecha, no puede estar vencida
      });
      
      this.renderRutasVencidas();
      console.log('[HISTORIAL] Rutas vencidas cargadas:', this.rutasVencidas.length);
    } catch (error) {
      console.error('Error loading rutas vencidas:', error);
      this.rutasVencidas = [];
      this.renderRutasVencidas();
    }
  }

  renderRutasConcluidas() {
    const tbody = document.getElementById('tablaRutasConcluidas');
    if (!tbody) return;

    if (this.rutasConcluidas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-4">
            <i class="fas fa-history fa-2x text-muted mb-2"></i>
            <p class="text-muted">No hay rutas concluidas</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.rutasConcluidas.map(ruta => {
      const count = ruta.total_pasajeros_transportados || 0;
      const capacity = ruta.capacidad_pasajeros || 1;
      const ingresos = ruta.ingresos_generados != null ? parseFloat(ruta.ingresos_generados).toFixed(2) : '0.00';
      const porcentaje = capacity > 0 ? (count / capacity) * 100 : 0;
      const duracion = ruta.duracion || 'N/A';
      
      // Usar una referencia al objeto para preservar 'this'
      const self = window.AdminHistorial;
      
      return `
      <tr>
        <td>${ruta.id}</td>
        <td>
          <div class="d-flex align-items-center">
            <div>
              <strong class="text-primary">${ruta.origen}</strong><br>
              <i class="fas fa-arrow-right text-muted mx-1"></i><br>
              <strong class="text-success">${ruta.destino}</strong>
              ${ruta.distancia_km ? `<br><small class="text-muted">${ruta.distancia_km} km</small>` : ''}
            </div>
          </div>
        </td>
        <td>
          <div class="text-center">
            <strong>${self.formatDate(ruta.fecha_salida)}</strong><br>
            <span class="badge bg-primary">${ruta.hora_salida || 'N/A'}</span>
          </div>
        </td>
        <td>
          <div class="text-center">
            <span class="badge bg-info">${duracion}</span>
          </div>
        </td>
        <td>
          <div class="text-center">
            <span class="badge bg-success">${count}</span>
          </div>
        </td>
        <td>
          <div class="text-center">
            <span class="text-success fw-bold">S/ ${ingresos}</span>
          </div>
        </td>
        <td>
          <div class="text-center">
            <div class="progress mb-1" style="height: 15px;">
              <div class="progress-bar bg-success"
                   style="width: ${porcentaje.toFixed(2)}%"
                   title="${count}/${capacity}">
              </div>
            </div>
            <small class="text-muted">${count}/${capacity} (${Math.round(porcentaje)}%)</small>
          </div>
        </td>
        <td>
          <div class="text-center">
            <span class="text-muted">${self.formatDateTime(ruta.fecha_conclusion)}</span>
          </div>
        </td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-info" onclick="window.AdminHistorial.verDetalleRuta(${ruta.id}, 'concluida')" title="Ver detalle">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-primary" onclick="window.AdminHistorial.generarReporte(${ruta.id})" title="Generar reporte">
              <i class="fas fa-file-pdf"></i>
            </button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  renderRutasActivas() {
    const tbody = document.getElementById('tablaRutasActivas');
    if (!tbody) return;

    if (this.rutasActivas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center py-4">
            <i class="fas fa-route fa-2x text-muted mb-2"></i>
            <p class="text-muted">No hay rutas activas programadas</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.rutasActivas.map(ruta => {
      const fechaSalida = new Date(ruta.fecha_salida);
      const fechaLlegada = new Date(ruta.fecha_llegada);
      const reservas = ruta.reservas_count || 0;
      const capacidad = ruta.capacidad_pasajeros || 40;
      const porcentajeOcupacion = capacidad > 0 ? (reservas / capacidad) * 100 : 0;
      
      return `
      <tr>
        <td>${ruta.id}</td>
        <td>
          <div class="d-flex align-items-center">
            <div>
              <strong class="text-primary">${ruta.origen}</strong><br>
              <i class="fas fa-arrow-right text-muted mx-1"></i><br>
              <strong class="text-success">${ruta.destino}</strong>
            </div>
          </div>
        </td>
        <td>
          <div class="text-center">
            <strong>${window.AdminHistorial.formatDate(ruta.fecha_salida)}</strong><br>
            <span class="badge bg-primary">${ruta.hora_salida || 'N/A'}</span>
          </div>
        </td>
        <td>
          <div class="text-center">
            <strong>${window.AdminHistorial.formatDate(ruta.fecha_llegada)}</strong><br>
            <span class="badge bg-success">${ruta.hora_llegada || 'N/A'}</span>
          </div>
        </td>
        <td>
          <span class="fw-bold text-success">S/ ${parseFloat(ruta.precio).toFixed(2)}</span>
        </td>
        <td>
          <div class="text-center">
            <div class="progress mb-1" style="height: 15px;">
              <div class="progress-bar ${porcentajeOcupacion > 80 ? 'bg-danger' : porcentajeOcupacion > 60 ? 'bg-warning' : 'bg-success'}"
                   style="width: ${porcentajeOcupacion.toFixed(1)}%"
                   title="${reservas}/${capacidad}">
              </div>
            </div>
            <small class="text-muted">${reservas}/${capacidad}</small>
          </div>
        </td>
        <td>
          <span class="badge bg-info">${reservas}</span>
        </td>
        <td>
          <span class="badge ${ruta.estado === 'activo' ? 'bg-success' : ruta.estado === 'inactivo' ? 'bg-secondary' : 'bg-warning'}">
            ${ruta.estado || 'activo'}
          </span>
        </td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-primary" onclick="window.AdminHistorial.verDetalleRuta(${ruta.id}, 'activa')" title="Ver detalles">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-info" onclick="window.AdminHistorial.editarRuta(${ruta.id})" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="window.AdminHistorial.marcarComoVencida(${ruta.id})" title="Marcar como vencida">
              <i class="fas fa-clock"></i>
            </button>
          </div>
        </td>
      </tr>
      `;
    }).join('');
  }

  renderRutasVencidas() {
    const tbody = document.getElementById('tablaRutasVencidas');
    if (!tbody) return;

    if (this.rutasVencidas.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4">
            <i class="fas fa-check-circle fa-2x text-success mb-2"></i>
            <p class="text-muted">No hay rutas vencidas pendientes</p>
            <small class="text-success">¡Todas las rutas están al día!</small>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.rutasVencidas.map(ruta => {
      const fechaSalida = new Date(ruta.fecha_salida);
      const ahora = new Date();
      const diasVencida = Math.ceil((ahora - fechaSalida) / (1000 * 60 * 60 * 24));
      
      return `
      <tr class="table-warning">
        <td>${ruta.id}</td>
        <td>
          <div class="d-flex align-items-center">
            <div>
              <strong class="text-primary">${ruta.origen}</strong><br>
              <i class="fas fa-arrow-right text-muted mx-1"></i><br>
              <strong class="text-success">${ruta.destino}</strong>
            </div>
          </div>
        </td>
        <td>
          <div class="text-center">
            <strong class="text-danger">${window.AdminHistorial.formatDate(ruta.fecha_salida)}</strong><br>
            <span class="badge bg-danger">${ruta.hora_salida || 'N/A'}</span>
          </div>
        </td>
        <td>
          <div class="text-center">
            <span class="badge ${diasVencida > 7 ? 'bg-danger' : diasVencida > 3 ? 'bg-warning' : 'bg-info'}">
              ${diasVencida} ${diasVencida === 1 ? 'día' : 'días'}
            </span>
          </div>
        </td>
        <td>
          <span class="fw-bold text-success">S/ ${parseFloat(ruta.precio).toFixed(2)}</span>
        </td>
        <td>
          <span class="badge bg-warning">Vencida</span>
        </td>
        <td>
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-primary" onclick="window.AdminHistorial.verDetalleRuta(${ruta.id}, 'vencida')" title="Ver detalles">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-warning" onclick="window.AdminHistorial.procesarRutaVencida(${ruta.id})" title="Procesar como concluida">
              <i class="fas fa-forward"></i>
            </button>
          </div>
        </td>
      </tr>
      `;
    }).join('');
  }

  actualizarContadores() {
    // Actualizar badges en las pestañas
    const badgeActivas = document.getElementById('badge-activas');
    const badgeConcluidas = document.getElementById('badge-concluidas');
    const badgeVencidas = document.getElementById('badge-vencidas');
    
    if (badgeActivas) badgeActivas.textContent = this.rutasActivas.length;
    if (badgeConcluidas) badgeConcluidas.textContent = this.rutasConcluidas.length;
    if (badgeVencidas) badgeVencidas.textContent = this.rutasVencidas.length;
    
    // Actualizar contadores en las tarjetas de estadísticas
    const countActivas = document.getElementById('count-rutas-activas');
    const countConcluidas = document.getElementById('count-rutas-concluidas');
    const countVencidas = document.getElementById('count-rutas-vencidas');
    const totalIngresos = document.getElementById('total-ingresos-concluidas');
    
    if (countActivas) countActivas.textContent = this.rutasActivas.length;
    if (countConcluidas) countConcluidas.textContent = this.rutasConcluidas.length;
    if (countVencidas) countVencidas.textContent = this.rutasVencidas.length;
    
    // Calcular ingresos totales
    const ingresosTotales = this.rutasConcluidas.reduce((total, ruta) => {
      return total + (parseFloat(ruta.ingresos_generados) || 0);
    }, 0);
    
    if (totalIngresos) totalIngresos.textContent = `S/ ${ingresosTotales.toFixed(2)}`;
  }

  // Métodos de procesamiento
  async verificarRutasVencidas() {
    try {
      this.showAlert('Verificando rutas vencidas...', 'info');
      await this.cargarRutasVencidas();
      this.showAlert(`Se encontraron ${this.rutasVencidas.length} rutas vencidas`, 'success');
    } catch (error) {
      console.error('Error verificando rutas vencidas:', error);
      this.showAlert('Error al verificar rutas vencidas', 'danger');
    }
  }

  async procesarRutasVencidas() {
    if (this.rutasVencidas.length === 0) {
      this.showAlert('No hay rutas vencidas para procesar', 'info');
      return;
    }

    if (!confirm(`¿Está seguro de procesar ${this.rutasVencidas.length} rutas vencidas como concluidas?`)) {
      return;
    }

    try {
      this.showAlert('Procesando rutas vencidas...', 'info');
      
      for (const ruta of this.rutasVencidas) {
        await this.procesarRutaVencida(ruta.id);
      }
      
      await this.cargarHistorial();
      this.showAlert('Todas las rutas vencidas han sido procesadas', 'success');
    } catch (error) {
      console.error('Error procesando rutas vencidas:', error);
      this.showAlert('Error al procesar rutas vencidas', 'danger');
    }
  }

  async procesarRutaVencida(rutaId) {
    try {
      const response = await fetch(`${API_BASE_URL}/rutas-concluidas.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rutaId })
      });
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        console.log(`Ruta ${rutaId} procesada exitosamente`);
        return true;
      } else {
        throw new Error(data.error || data.message || 'Error al procesar ruta');
      }
    } catch (error) {
      console.error(`Error procesando ruta ${rutaId}:`, error);
      throw error;
    }
  }

  async generarReporteGeneral() {
    try {
      this.showAlert('Generando reporte general...', 'info');
      
      // Crear elemento de descarga
      const link = document.createElement('a');
      link.href = `${API_BASE_URL}/rutas-concluidas.php?reporte=general&pdf=1`;
      link.download = `reporte_general_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      
      this.showAlert('Reporte general generado exitosamente', 'success');
    } catch (error) {
      console.error('Error generando reporte general:', error);
      this.showAlert('Error al generar reporte general', 'danger');
    }
  }

  async verDetalleRuta(rutaId, tipo) {
    try {
      let ruta;
      if (tipo === 'activa') {
        ruta = this.rutasActivas.find(r => r.id == rutaId);
      } else if (tipo === 'vencida') {
        ruta = this.rutasVencidas.find(r => r.id == rutaId);
      } else {
        ruta = this.rutasConcluidas.find(r => r.id == rutaId);
      }
      
      if (!ruta) {
        this.showAlert('Ruta no encontrada', 'danger');
        return;
      }
      
      // Mostrar modal con detalles
      const modal = document.getElementById('modalDetalleRutaConcluida');
      const content = document.getElementById('detalleRutaContent');
      
      content.innerHTML = `
        <div class="row">
          <div class="col-md-6">
            <h6 class="text-primary"><i class="fas fa-map-marker-alt"></i> Información de la Ruta</h6>
            <table class="table table-sm">
              <tr><td><strong>ID:</strong></td><td>${ruta.id}</td></tr>
              <tr><td><strong>Origen:</strong></td><td>${ruta.origen}</td></tr>
              <tr><td><strong>Destino:</strong></td><td>${ruta.destino}</td></tr>
              <tr><td><strong>Precio:</strong></td><td>S/ ${parseFloat(ruta.precio).toFixed(2)}</td></tr>
              <tr><td><strong>Duración:</strong></td><td>${ruta.duracion || 'N/A'}</td></tr>
              <tr><td><strong>Distancia:</strong></td><td>${ruta.distancia_km || 'N/A'} km</td></tr>
            </table>
          </div>
          <div class="col-md-6">
            <h6 class="text-success"><i class="fas fa-clock"></i> Información Temporal</h6>
            <table class="table table-sm">
              <tr><td><strong>Fecha Salida:</strong></td><td>${window.AdminHistorial.formatDate(ruta.fecha_salida)}</td></tr>
              <tr><td><strong>Hora Salida:</strong></td><td>${ruta.hora_salida || 'N/A'}</td></tr>
              <tr><td><strong>Fecha Llegada:</strong></td><td>${window.AdminHistorial.formatDate(ruta.fecha_llegada)}</td></tr>
              <tr><td><strong>Hora Llegada:</strong></td><td>${ruta.hora_llegada || 'N/A'}</td></tr>
              <tr><td><strong>Estado:</strong></td><td><span class="badge bg-${tipo === 'activa' ? 'success' : tipo === 'vencida' ? 'warning' : 'info'}">${tipo}</span></td></tr>
              ${ruta.fecha_conclusion ? `<tr><td><strong>Conclusión:</strong></td><td>${window.AdminHistorial.formatDate(ruta.fecha_conclusion)}</td></tr>` : ''}
            </table>
          </div>
        </div>
        ${tipo === 'concluida' ? `
        <div class="row mt-3">
          <div class="col-md-12">
            <h6 class="text-info"><i class="fas fa-chart-bar"></i> Estadísticas del Viaje</h6>
            <div class="row">
              <div class="col-md-3">
                <div class="card bg-light">
                  <div class="card-body text-center">
                    <h5 class="text-primary">${ruta.total_pasajeros_transportados || 0}</h5>
                    <small>Pasajeros</small>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-light">
                  <div class="card-body text-center">
                    <h5 class="text-success">S/ ${parseFloat(ruta.ingresos_generados || 0).toFixed(2)}</h5>
                    <small>Ingresos</small>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-light">
                  <div class="card-body text-center">
                    <h5 class="text-info">${ruta.capacidad_pasajeros || 0}</h5>
                    <small>Capacidad</small>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card bg-light">
                  <div class="card-body text-center">
                    <h5 class="text-warning">${ruta.capacidad_pasajeros > 0 ? ((ruta.total_pasajeros_transportados || 0) / ruta.capacidad_pasajeros * 100).toFixed(1) : 0}%</h5>
                    <small>Ocupación</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        ` : ''}
      `;
      
      const bootstrapModal = new bootstrap.Modal(modal);
      bootstrapModal.show();
      
    } catch (error) {
      console.error('Error mostrando detalle de ruta:', error);
      this.showAlert('Error al mostrar detalle de ruta', 'danger');
    }
  }

  async marcarComoVencida(rutaId) {
    if (!confirm('¿Está seguro de marcar esta ruta como vencida?')) {
      return;
    }

    try {
      await this.procesarRutaVencida(rutaId);
      await this.cargarHistorial();
      this.showAlert('Ruta marcada como vencida y procesada', 'success');
    } catch (error) {
      console.error('Error marcando ruta como vencida:', error);
      this.showAlert('Error al marcar ruta como vencida', 'danger');
    }
  }

  async editarRuta(rutaId) {
    // Redirigir a la sección de rutas con el ID para editar
    if (window.AdminMain) {
      window.AdminMain.showSection('rutas');
      // Aquí podrías agregar lógica para seleccionar la ruta específica
    }
  }

  async generarReporte(rutaId) {
    try {
      this.showAlert('Generando reporte de ruta...', 'info');
      
      // Mostrar modal de progreso
      this.mostrarModalProgreso();
      
      // Crear elemento de descarga
      const link = document.createElement('a');
      link.href = `${API_BASE_URL}/rutas-concluidas.php?id=${rutaId}&reporte=1&pdf=1`;
      link.download = `reporte_ruta_${rutaId}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      
      // Ocultar modal después de un momento
      setTimeout(() => {
        this.ocultarModalProgreso();
        this.showAlert('Reporte de ruta generado exitosamente', 'success');
      }, 2000);
      
    } catch (error) {
      console.error('Error generando reporte de ruta:', error);
      this.ocultarModalProgreso();
      this.showAlert('Error al generar reporte de ruta', 'danger');
    }
  }

  mostrarModalProgreso() {
    // Crear o mostrar modal de progreso
    let modal = document.getElementById('modalProgreso');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modalProgreso';
      modal.className = 'modal fade';
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-body text-center py-4">
              <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Generando...</span>
              </div>
              <h5>Generando Reporte PDF</h5>
              <p class="text-muted">Por favor espera mientras se genera el reporte...</p>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
  }

  ocultarModalProgreso() {
    const modal = document.getElementById('modalProgreso');
    if (modal) {
      const bootstrapModal = bootstrap.Modal.getInstance(modal);
      if (bootstrapModal) {
        bootstrapModal.hide();
      }
    }
  }

  // Funciones utilitarias
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'N/A';
    }
  }

  formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando fecha/hora:', error);
      return 'N/A';
    }
  }

  showAlert(message, type = 'info') {
    // Crear o actualizar alerta
    const alertContainer = document.querySelector('.alert-container') || this.createAlertContainer();
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto-remove después de 5 segundos
    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 5000);
  }

  createAlertContainer() {
    let container = document.querySelector('.alert-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'alert-container position-fixed top-0 end-0 p-3';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }
    return container;
  }
}

// Crear instancia global
window.AdminHistorial = new AdminHistorial();

// Función global para cargar rutas concluidas (compatibilidad)
function cargarRutasConcluidas() {
  if (window.AdminHistorial) {
    return window.AdminHistorial.cargarRutasConcluidas();
  }
}

// Función global para mostrar estadísticas
function mostrarEstadisticas() {
  if (window.AdminEstadisticas) {
    return window.AdminEstadisticas.cargarEstadisticas();
  }
}

// Hacer las funciones accesibles globalmente
window.cargarRutasConcluidas = () => window.AdminHistorial.cargarRutasConcluidas();
window.procesarRutasVencidas = () => window.AdminHistorial.procesarRutasVencidas();
window.verificarRutasVencidasAutomatico = () => window.AdminHistorial.verificarRutasVencidasAutomatico();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.adminHistorial = window.AdminHistorial; // For backward compatibility
});

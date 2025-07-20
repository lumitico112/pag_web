// Admin Estadísticas - Gestión de estadísticas para administradores

class AdminEstadisticas {
  constructor() {
    this.estadisticas = {};
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Add any specific event listeners for estadísticas section
  }

  async cargarEstadisticas() {
    try {
      console.log('[ESTADISTICAS] Iniciando carga de estadísticas...');
      
      // Mostrar indicadores de carga
      this.mostrarCargando();
      
      // Cargar todas las estadísticas
      await this.cargarEstadisticasGenerales();
      await this.cargarEstadisticasRutas();
      await this.cargarEstadisticasIngresos();
      
      // Organizar estadísticas en el orden correcto
      this.organizarEstadisticas();
      
      console.log('[ESTADISTICAS] Todas las estadísticas cargadas exitosamente');
      this.showAlert('Estadísticas actualizadas correctamente', 'success');
      
    } catch (error) {
      console.error('[ESTADISTICAS] Error loading estadísticas:', error);
      this.showAlert('Error al cargar las estadísticas: ' + error.message, 'danger');
    }
  }

  mostrarCargando() {
    // Mostrar indicadores de carga en las tarjetas principales
    this.actualizarElemento('stat-total-concluidas', '...');
    this.actualizarElemento('stat-total-pasajeros', '...');
    this.actualizarElemento('stat-total-ingresos', '...');
    
    console.log('[ESTADISTICAS] Indicadores de carga mostrados');
  }

  async cargarEstadisticasGenerales() {
    try {
      console.log('[ESTADISTICAS] Cargando estadísticas generales...');
      
      // Obtener rutas concluidas usando el endpoint correcto
      const rutasResponse = await fetch(`${API_BASE_URL}/rutas-concluidas.php`);
      const rutasText = await rutasResponse.text();
      console.log('[ESTADISTICAS] Respuesta rutas concluidas:', rutasText.substring(0, 200));
      
      let rutasData;
      try {
        rutasData = JSON.parse(rutasText);
      } catch (e) {
        console.error('[ESTADISTICAS] Error parsing JSON rutas concluidas:', e);
        rutasData = Array.isArray(JSON.parse(rutasText)) ? JSON.parse(rutasText) : [];
      }
      
      // Manejar tanto formato array directo como objeto con success
      let rutas = [];
      if (Array.isArray(rutasData)) {
        rutas = rutasData;
      } else if (rutasData.success && Array.isArray(rutasData.rutas)) {
        rutas = rutasData.rutas;
      }
      
      console.log('[ESTADISTICAS] Rutas concluidas encontradas:', rutas.length);
      
      const totalConcluidas = rutas.length;
      
      // Calcular total de pasajeros transportados
      const totalPasajeros = rutas.reduce((total, ruta) => {
        return total + (parseInt(ruta.total_pasajeros_transportados) || 0);
      }, 0);
      
      // Calcular total de ingresos generados
      const totalIngresos = rutas.reduce((total, ruta) => {
        return total + (parseFloat(ruta.ingresos_generados) || 0);
      }, 0);
      
      console.log('[ESTADISTICAS] Calculado - Concluidas:', totalConcluidas, 'Pasajeros:', totalPasajeros, 'Ingresos:', totalIngresos);
      
      // Actualizar elementos en el DOM
      this.actualizarElemento('stat-total-concluidas', totalConcluidas);
      this.actualizarElemento('stat-total-pasajeros', this.formatNumber(totalPasajeros));
      this.actualizarElemento('stat-total-ingresos', `S/ ${this.formatCurrency(totalIngresos)}`);
      
      // Guardar estadísticas
      this.estadisticas.generales = {
        totalConcluidas,
        totalPasajeros,
        totalIngresos
      };
      
      console.log('[ESTADISTICAS] Estadísticas generales actualizadas');
      
    } catch (error) {
      console.error('[ESTADISTICAS] Error loading general stats:', error);
      // Mostrar valores por defecto
      this.actualizarElemento('stat-total-concluidas', '--');
      this.actualizarElemento('stat-total-pasajeros', '--');
      this.actualizarElemento('stat-total-ingresos', 'S/ --');
    }
  }

  async cargarEstadisticasRutas() {
    try {
      console.log('[ESTADISTICAS] Cargando estadísticas de rutas...');
      
      const response = await fetch(`${API_BASE_URL}/rutas.php`);
      const responseText = await response.text();
      console.log('[ESTADISTICAS] Respuesta rutas activas:', responseText.substring(0, 200));
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('[ESTADISTICAS] Error parsing JSON rutas:', e);
        return;
      }
      
      if (data.success && Array.isArray(data.rutas)) {
        const rutas = data.rutas;
        console.log('[ESTADISTICAS] Rutas activas encontradas:', rutas.length);
        
        // Estadísticas por estado
        const estadisticasPorEstado = {
          activo: 0,
          inactivo: 0,
          mantenimiento: 0
        };
        
        rutas.forEach(ruta => {
          if (estadisticasPorEstado.hasOwnProperty(ruta.estado)) {
            estadisticasPorEstado[ruta.estado]++;
          }
        });
        
        console.log('[ESTADISTICAS] Por estado:', estadisticasPorEstado);
        
        // Rutas más populares (por número de reservas)
        const rutasPopulares = rutas
          .sort((a, b) => (b.reservas_count || 0) - (a.reservas_count || 0))
          .slice(0, 5);
        
        console.log('[ESTADISTICAS] Rutas populares:', rutasPopulares.length);
        
        this.estadisticas.rutas = {
          porEstado: estadisticasPorEstado,
          populares: rutasPopulares,
          total: rutas.length
        };
      } else {
        console.warn('[ESTADISTICAS] Respuesta de rutas no válida');
      }
    } catch (error) {
      console.error('[ESTADISTICAS] Error loading route stats:', error);
    }
  }

  async cargarEstadisticasIngresos() {
    try {
      console.log('[ESTADISTICAS] Cargando estadísticas de ingresos...');
      
      const response = await fetch(`${API_BASE_URL}/rutas-concluidas.php?estadisticas=1`);
      if (!response.ok) {
        console.warn('[ESTADISTICAS] No se pudo cargar estadísticas detalladas');
        return;
      }
      
      const responseText = await response.text();
      console.log('[ESTADISTICAS] Respuesta estadísticas:', responseText.substring(0, 200));
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('[ESTADISTICAS] Error parsing JSON estadísticas:', e);
        return;
      }
      
      if (data && typeof data === 'object') {
        console.log('[ESTADISTICAS] Estadísticas recibidas:', Object.keys(data));
        
        // Procesar datos de estadísticas
        this.estadisticas.ingresos = {
          porMes: data.por_mes || [],
          totalRutas: data.total_rutas_concluidas || 0,
          totalPasajeros: data.total_pasajeros_transportados || 0,
          totalIngresos: data.total_ingresos || 0
        };
        
        console.log('[ESTADISTICAS] Procesadas estadísticas de ingresos');
        this.renderGraficasBasicas();
      } else {
        console.warn('[ESTADISTICAS] Datos de estadísticas no válidos');
      }
    } catch (error) {
      console.error('[ESTADISTICAS] Error loading income stats:', error);
    }
  }

  renderGraficasBasicas() {
    // Esta función renderiza gráficas básicas usando texto
    // En una implementación completa, usarías Chart.js o similar
    
    const container = document.querySelector('#estadisticas-section .card-body');
    if (!container) return;
    
    // Limpiar contenido existente de gráficas
    const existingCharts = container.querySelector('.charts-container');
    if (existingCharts) {
      existingCharts.remove();
    }
    
    const chartsHtml = `
      <div class="charts-container">
        <div class="row">
          <div class="col-md-6">
            <div class="card">
              <div class="card-header">
                <h6><i class="fas fa-chart-pie"></i> Rutas por Estado</h6>
              </div>
              <div class="card-body d-flex flex-column justify-content-center align-items-center" style="height: 180px;">
                ${this.renderEstadoChart()}
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card">
              <div class="card-header">
                <h6><i class="fas fa-star"></i> Top 5 Rutas Populares</h6>
              </div>
              <div class="card-body d-flex flex-column justify-content-center align-items-center" style="height: 180px;">
                ${this.renderRutasPopulares()}
              </div>
            </div>
          </div>
        </div>
        <div class="row mt-4">
          <div class="col-md-6">
            <div class="card">
              <div class="card-header">
                <h6><i class="fas fa-chart-line"></i> Tendencia de Ingresos</h6>
              </div>
              <div class="card-body d-flex flex-column justify-content-center align-items-center" style="height: 180px;">
                ${this.renderIngresosTrend()}
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card">
              <div class="card-header">
                <h6><i class="fas fa-trophy"></i> Rutas Más Rentables</h6>
              </div>
              <div class="card-body d-flex flex-column justify-content-center align-items-center" style="height: 180px;">
                ${this.renderRutasRentables()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', chartsHtml);
  }

  renderEstadoChart() {
    if (!this.estadisticas.rutas || !this.estadisticas.rutas.porEstado) {
      return '<p class="text-muted">No hay datos disponibles</p>';
    }
    const estados = this.estadisticas.rutas.porEstado;
    const total = Object.values(estados).reduce((sum, val) => sum + val, 0);
    if (total === 0) {
      return '<p class="text-muted">No hay rutas registradas</p>';
    }
    // Nuevo diseño visual tipo badges grandes y centrados
    return `
      <div class="w-100 text-center d-flex flex-column justify-content-center align-items-center" style="height: 140px;">
        <h5 style="font-size: 2rem;">Rutas por Estado</h5>
        <div id="info-rutas-estado" style="font-size: 1.5rem; margin-top: 10px;">
          <span class="badge bg-success mx-2">Activas: <span id="rutas-activas">${estados.activo}</span></span>
          <span class="badge bg-info mx-2">Concluidas: <span id="rutas-concluidas">${estados.inactivo}</span></span>
          <span class="badge bg-warning mx-2">Vencidas: <span id="rutas-vencidas">${estados.mantenimiento}</span></span>
        </div>
      </div>
    `;
  }

  renderRutasPopulares() {
    if (!this.estadisticas.rutas || !this.estadisticas.rutas.populares) {
      return '<p class="text-muted">No hay datos disponibles</p>';
    }
    
    const rutas = this.estadisticas.rutas.populares;
    
    if (rutas.length === 0) {
      return '<p class="text-muted">No hay rutas disponibles</p>';
    }
    
    return rutas.map((ruta, index) => `
      <div class="d-flex justify-content-between align-items-center mb-2 ${index < rutas.length - 1 ? 'border-bottom pb-2' : ''}">
        <div>
          <div class="fw-bold">${ruta.origen}</div>
          <small class="text-muted">${ruta.destino}</small>
        </div>
        <div class="text-end">
          <span class="badge bg-primary">${ruta.reservas_count || 0} reservas</span>
        </div>
      </div>
    `).join('');
  }

  renderIngresosTrend() {
    if (!this.estadisticas.ingresos || !this.estadisticas.ingresos.porMes) {
      return '<p class="text-muted">No hay datos de ingresos disponibles</p>';
    }
    
    let ingresosPorMes = this.estadisticas.ingresos.porMes;
    if (!Array.isArray(ingresosPorMes) || ingresosPorMes.length === 0) {
      return '<div class="w-100 text-center d-flex flex-column justify-content-center align-items-center" style="height: 140px;"><p class="text-muted">No hay datos mensuales disponibles</p></div>';
    }
    ingresosPorMes = ingresosPorMes.slice(0, 6);
    const maxIngreso = Math.max(...ingresosPorMes.map(item => parseFloat(item.ingresos || 0)));
    return `
      <div class="ingresos-trend">
        ${ingresosPorMes.map(item => {
          const ingreso = parseFloat(item.ingresos || 0);
          const porcentaje = maxIngreso > 0 ? (ingreso / maxIngreso * 100) : 0;
          return `
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span>${this.formatMes(item.mes)}</span>
              <div class="d-flex align-items-center">
                <div class="progress me-2" style="width: 150px; height: 15px;">
                  <div class="progress-bar bg-success" style="width: ${porcentaje}%"></div>
                </div>
                <span class="fw-bold text-success">S/ ${this.formatCurrency(ingreso)}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  renderRutasRentables() {
    if (!this.estadisticas.ingresos || !this.estadisticas.ingresos.rutasRentables) {
      return '<p class="text-muted">No hay datos disponibles</p>';
    }
    
    const rutas = this.estadisticas.ingresos.rutasRentables.slice(0, 6);
    if (rutas.length === 0) {
      return '<div class="w-100 text-center d-flex flex-column justify-content-center align-items-center" style="height: 140px;"><p class="text-muted">No hay rutas rentables registradas</p></div>';
    }
    return rutas.map((ruta, index) => `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <div class="d-flex align-items-center">
            <span class="badge bg-warning me-2">${index + 1}</span>
            <div>
              <div class="fw-bold small">${ruta.origen}</div>
              <small class="text-muted">${ruta.destino}</small>
            </div>
          </div>
        </div>
        <div class="text-end">
          <div class="fw-bold text-success">S/ ${this.formatCurrency(ruta.ingresos_total)}</div>
          <small class="text-muted">${ruta.viajes_count} viajes</small>
        </div>
      </div>
    `).join('');
  }

  actualizarElemento(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.textContent = valor;
    }
  }

  formatNumber(num) {
    return new Intl.NumberFormat('es-PE').format(num);
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatMes(mesAno) {
    // Formato: YYYY-MM
    const [year, month] = mesAno.split('-');
    const meses = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    return `${meses[parseInt(month) - 1]} ${year}`;
  }

  async exportarEstadisticas() {
    try {
      this.showAlert('Exportando estadísticas...', 'info');
      
      // Aquí implementarías la exportación real
      // Por ahora, simulamos con un timeout
      setTimeout(() => {
        this.showAlert('Estadísticas exportadas exitosamente', 'success');
      }, 2000);
      
    } catch (error) {
      console.error('Error exporting statistics:', error);
      this.showAlert('Error al exportar estadísticas', 'danger');
    }
  }

  showAlert(message, type = 'info') {
    if (window.adminDashboard) {
      window.adminDashboard.showAlert(message, type);
    } else {
      alert(message);
    }
  }

  // Organizar orden de visualización de estadísticas
  organizarEstadisticas() {
    console.log('[ESTADISTICAS] Organizando estadísticas en orden correcto...');
    
    // Actualizar contadores principales en orden
    this.actualizarContadoresPrincipales();
    
    // Organizar gráficas si existen
    this.organizarGraficas();
  }

  actualizarContadoresPrincipales() {
    // Asegurar que los elementos existan y tengan valores correctos
    const elementos = [
      { id: 'stat-total-concluidas', valor: this.estadisticas.total_rutas_concluidas || 0 },
      { id: 'stat-total-pasajeros', valor: this.estadisticas.total_pasajeros_transportados || 0 },
      { id: 'stat-total-ingresos', valor: `S/ ${parseFloat(this.estadisticas.total_ingresos || 0).toFixed(2)}` }
    ];

    elementos.forEach(elemento => {
      const el = document.getElementById(elemento.id);
      if (el) {
        el.textContent = elemento.valor;
        el.style.opacity = '1';
        console.log(`[ESTADISTICAS] Actualizado ${elemento.id}: ${elemento.valor}`);
      }
    });
  }

  organizarGraficas() {
    // Placeholder para futuras gráficas organizadas
    console.log('[ESTADISTICAS] Gráficas organizadas');
  }
}

// Crear instancia global
window.AdminEstadisticas = new AdminEstadisticas();

// Global functions for onclick handlers
function mostrarEstadisticas() {
  if (window.AdminEstadisticas) {
    window.AdminEstadisticas.cargarEstadisticas();
  }
}

function exportarEstadisticas() {
  if (window.AdminEstadisticas) {
    window.AdminEstadisticas.exportarEstadisticas();
  }
}

// Crear instancia global
window.AdminEstadisticas = new AdminEstadisticas();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.adminEstadisticas = window.AdminEstadisticas; // For backward compatibility
  
  // Auto-load estadísticas if we're on the estadísticas section
  setTimeout(() => {
    const estadisticasSection = document.getElementById('estadisticas-section');
    if (estadisticasSection && estadisticasSection.classList.contains('active')) {
      console.log('[ESTADISTICAS] Sección activa detectada, cargando automáticamente...');
      window.AdminEstadisticas.cargarEstadisticas();
    }
  }, 2000);
});

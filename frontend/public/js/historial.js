// historial.js
// Script base para historial de compras de usuario

document.addEventListener('DOMContentLoaded', function() {
    if (!auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    cargarHistorial();
});

async function cargarHistorial() {
    const historialDiv = document.getElementById('historial');
    historialDiv.innerHTML = '<div class="col-12 text-center py-5"><i class="fas fa-spinner fa-spin fa-2x text-primary"></i><p class="mt-2">Cargando historial...</p></div>';
    try {
        const response = await auth.authenticatedFetch(`${API_BASE_URL}/reservas.php?action=historial`);
        const data = await response.json();
        if (data.success && Array.isArray(data.historial)) {
            if (data.historial.length === 0) {
                historialDiv.innerHTML = '<div class="col-12 text-center py-5"><i class="fas fa-info-circle fa-2x text-secondary"></i><p class="mt-2">No tienes compras registradas.</p></div>';
                return;
            }
            historialDiv.innerHTML = '';
            data.historial.forEach(item => {
                historialDiv.innerHTML += renderCompra(item);
            });
        } else {
            historialDiv.innerHTML = '<div class="col-12 text-center py-5 text-danger">Error al cargar el historial.</div>';
        }
    } catch (error) {
        historialDiv.innerHTML = '<div class="col-12 text-center py-5 text-danger">Error al cargar el historial.</div>';
    }
}

function renderCompra(item) {
    // Tarjeta horizontal, bien contenida
    return `<div class="card historial-card">
        <div class="card-body d-flex flex-column justify-content-between h-100">
            <h5 class="card-title">Ruta: ${item.ruta || item.origen || 'Desconocida'} - ${item.destino || ''}</h5>
            <p class="card-text"><strong>Fecha:</strong> ${item.fecha || item.fecha_salida || '---'}</p>
            <p class="card-text"><strong>Asiento:</strong> ${item.asiento || item.asiento_numero || '---'}</p>
            <p class="card-text"><strong>Precio:</strong> S/ ${item.precio || item.precio_pagado || '---'}</p>
            <p class="card-text"><strong>Estado:</strong> ${item.estado || item.estado_reserva || '---'}</p>
        </div>
    </div>`;
}

function filtrarHistorial() {
    // Implementa la lógica de filtrado si tu API lo soporta
    cargarHistorial();
}

function restablecerFiltros() {
    document.getElementById('fechaInicio').value = '';
    document.getElementById('fechaFin').value = '';
    cargarHistorial();
}

function ordenarPorFecha(direccion) {
    // Implementa la lógica de ordenamiento si tu API lo soporta
    cargarHistorial();
}

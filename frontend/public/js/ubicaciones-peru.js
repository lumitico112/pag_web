// Datos de ubicaciones de Perú - Regiones, Provincias, Distritos y Ciudades principales
const UBICACIONES_PERU = {
  "Lima": {
    "Lima": {
      "Cercado de Lima": ["Lima Centro"],
      "Miraflores": ["Miraflores"],
      "San Isidro": ["San Isidro"],
      "Barranco": ["Barranco"],
      "La Molina": ["La Molina"],
      "San Borja": ["San Borja"],
      "Surco": ["Santiago de Surco"],
      "Callao": ["Callao"],
      "San Miguel": ["San Miguel"],
      "Pueblo Libre": ["Pueblo Libre"],
      "Jesús María": ["Jesús María"],
      "Lince": ["Lince"]
    },
    "Huaral": {
      "Huaral": ["Huaral Ciudad"],
      "Chancay": ["Chancay Puerto"],
      "Aucallama": ["Aucallama"],
      "Ihuarí": ["Ihuarí"]
    },
    "Barranca": {
      "Barranca": ["Barranca Ciudad"],
      "Supe": ["Supe Puerto"],
      "Paramonga": ["Paramonga"],
      "Pativilca": ["Pativilca"]
    },
    "Huaura": {
      "Huacho": ["Huacho Ciudad"],
      "Vegueta": ["Vegueta"],
      "Sayán": ["Sayán"],
      "Hualmay": ["Hualmay"]
    },
    "Cañete": {
      "San Vicente de Cañete": ["Cañete Ciudad"],
      "Mala": ["Mala"],
      "Asia": ["Asia"],
      "Chincha": ["Chincha"]
    }
  },
  "La Libertad": {
    "Trujillo": {
      "Trujillo": ["Trujillo Centro"],
      "La Esperanza": ["La Esperanza"],
      "El Porvenir": ["El Porvenir"],
      "Florencia de Mora": ["Florencia de Mora"],
      "Huanchaco": ["Huanchaco"],
      "Laredo": ["Laredo"],
      "Moche": ["Moche"],
      "Salaverry": ["Salaverry"]
    },
    "Chepén": {
      "Chepén": ["Chepén Ciudad"],
      "Pacanga": ["Pacanga"]
    },
    "Pacasmayo": {
      "San Pedro de Lloc": ["San Pedro de Lloc"],
      "Pacasmayo": ["Pacasmayo"]
    },
    "Ascope": {
      "Ascope": ["Ascope"],
      "Casa Grande": ["Casa Grande"]
    }
  },
  "Lambayeque": {
    "Chiclayo": {
      "Chiclayo": ["Chiclayo Centro"],
      "José Leonardo Ortiz": ["JLO"],
      "La Victoria": ["La Victoria"],
      "Pimentel": ["Pimentel"],
      "Santa Rosa": ["Santa Rosa"],
      "Monsefú": ["Monsefú"],
      "Reque": ["Reque"]
    },
    "Lambayeque": {
      "Lambayeque": ["Lambayeque Ciudad"],
      "Túcume": ["Túcume"],
      "Motupe": ["Motupe"]
    },
    "Ferreñafe": {
      "Ferreñafe": ["Ferreñafe"],
      "Pueblo Nuevo": ["Pueblo Nuevo"]
    }
  },
  "Junín": {
    "Huancayo": {
      "Huancayo": ["Huancayo Centro"],
      "El Tambo": ["El Tambo"],
      "Chilca": ["Chilca"],
      "Sapallanga": ["Sapallanga"],
      "Hualhuas": ["Hualhuas"]
    },
    "Tarma": {
      "Tarma": ["Tarma Ciudad"],
      "Acobamba": ["Acobamba"],
      "La Unión": ["La Unión"]
    },
    "Jauja": {
      "Jauja": ["Jauja Ciudad"],
      "Apata": ["Apata"]
    },
    "Satipo": {
      "Satipo": ["Satipo"],
      "Mazamari": ["Mazamari"]
    }
  },
  "Arequipa": {
    "Arequipa": {
      "Arequipa": ["Arequipa Centro"],
      "Cayma": ["Cayma"],
      "Yanahuara": ["Yanahuara"],
      "Cerro Colorado": ["Cerro Colorado"],
      "Paucarpata": ["Paucarpata"],
      "Mariano Melgar": ["Mariano Melgar"]
    },
    "Camaná": {
      "Camaná": ["Camaná"],
      "Samuel Pastor": ["Samuel Pastor"]
    },
    "Islay": {
      "Mollendo": ["Mollendo"],
      "Islay": ["Matarani"]
    }
  },
  "Cusco": {
    "Cusco": {
      "Cusco": ["Cusco Centro"],
      "San Blas": ["San Blas"],
      "San Sebastián": ["San Sebastián"],
      "Wanchaq": ["Wanchaq"],
      "Santiago": ["Santiago"]
    },
    "Calca": {
      "Calca": ["Calca"],
      "Pisac": ["Pisac"],
      "Urubamba": ["Urubamba"]
    },
    "Anta": {
      "Anta": ["Anta"],
      "Izcuchaca": ["Izcuchaca"]
    }
  },
  "Piura": {
    "Piura": {
      "Piura": ["Piura Centro"],
      "Castilla": ["Castilla"],
      "Catacaos": ["Catacaos"],
      "Cura Mori": ["Cura Mori"]
    },
    "Sullana": {
      "Sullana": ["Sullana"],
      "Bellavista": ["Bellavista"],
      "Marcavelica": ["Marcavelica"]
    },
    "Talara": {
      "Pariñas": ["Talara"],
      "Los Órganos": ["Los Órganos"],
      "Máncora": ["Máncora"]
    },
    "Paita": {
      "Paita": ["Paita"],
      "Colán": ["Colán"]
    }
  },
  "Cajamarca": {
    "Cajamarca": {
      "Cajamarca": ["Cajamarca Centro"],
      "Los Baños del Inca": ["Los Baños del Inca"],
      "Llacanora": ["Llacanora"]
    },
    "Jaén": {
      "Jaén": ["Jaén"],
      "Bellavista": ["Bellavista"]
    },
    "Chota": {
      "Chota": ["Chota"],
      "Bambamarca": ["Bambamarca"]
    }
  },
  "Ica": {
    "Ica": {
      "Ica": ["Ica Centro"],
      "La Tinguiña": ["La Tinguiña"],
      "Los Aquijes": ["Los Aquijes"],
      "Parcona": ["Parcona"]
    },
    "Pisco": {
      "Pisco": ["Pisco"],
      "San Andrés": ["San Andrés"],
      "Paracas": ["Paracas"]
    },
    "Nazca": {
      "Nazca": ["Nazca"],
      "Vista Alegre": ["Vista Alegre"]
    },
    "Chincha": {
      "Chincha Alta": ["Chincha"],
      "Grocio Prado": ["Grocio Prado"]
    }
  },
  "Huánuco": {
    "Huánuco": {
      "Huánuco": ["Huánuco Centro"],
      "Amarilis": ["Amarilis"],
      "Pillco Marca": ["Pillco Marca"]
    },
    "Leoncio Prado": {
      "Rupa Rupa": ["Tingo María"],
      "Daniel Alomía Robles": ["Daniel Alomía Robles"]
    }
  },
  "Ucayali": {
    "Coronel Portillo": {
      "Callería": ["Pucallpa"],
      "Yarinacocha": ["Yarinacocha"],
      "Manantay": ["Manantay"]
    }
  },
  "Loreto": {
    "Maynas": {
      "Iquitos": ["Iquitos"],
      "Punchana": ["Punchana"],
      "Belén": ["Belén"],
      "San Juan Bautista": ["San Juan Bautista"]
    },
    "Requena": {
      "Requena": ["Requena"],
      "Capelo": ["Capelo"]
    }
  },
  "San Martín": {
    "San Martín": {
      "Tarapoto": ["Tarapoto"],
      "La Banda de Shilcayo": ["La Banda de Shilcayo"],
      "Morales": ["Morales"]
    },
    "Rioja": {
      "Rioja": ["Rioja"],
      "Nueva Cajamarca": ["Nueva Cajamarca"],
      "Elías Soplín Vargas": ["Rioja"]
    },
    "Moyobamba": {
      "Moyobamba": ["Moyobamba"],
      "Habana": ["Habana"]
    }
  }
};

// Coordenadas de las ciudades principales para cálculo de distancias
const COORDENADAS_CIUDADES = {
  // Lima y alrededores
  "Lima Centro": { lat: -12.0464, lng: -77.0428 },
  "Miraflores": { lat: -12.1211, lng: -77.0285 },
  "San Isidro": { lat: -12.1026, lng: -77.0351 },
  "Callao": { lat: -12.0565, lng: -77.1181 },
  "Huaral Ciudad": { lat: -11.4950, lng: -77.2070 },
  "Chancay Puerto": { lat: -11.5706, lng: -77.2694 },
  "Barranca Ciudad": { lat: -10.7500, lng: -77.7667 },
  "Paramonga": { lat: -10.6917, lng: -77.8250 },
  "Huacho Ciudad": { lat: -11.1067, lng: -77.6050 },
  "Cañete Ciudad": { lat: -13.0778, lng: -76.3864 },
  
  // La Libertad
  "Trujillo Centro": { lat: -8.1090, lng: -79.0215 },
  "Huanchaco": { lat: -8.0808, lng: -79.1217 },
  "Chepén Ciudad": { lat: -7.2256, lng: -79.4267 },
  "Pacasmayo": { lat: -7.4014, lng: -79.5714 },
  "Casa Grande": { lat: -7.7333, lng: -79.2333 },
  
  // Lambayeque
  "Chiclayo Centro": { lat: -6.7714, lng: -79.8370 },
  "Lambayeque Ciudad": { lat: -6.7017, lng: -79.9053 },
  "Ferreñafe": { lat: -6.6389, lng: -79.7889 },
  "Pimentel": { lat: -6.8367, lng: -79.9342 },
  
  // Piura
  "Piura Centro": { lat: -5.1945, lng: -80.6328 },
  "Sullana": { lat: -4.9039, lng: -80.6850 },
  "Talara": { lat: -4.5772, lng: -81.2719 },
  "Paita": { lat: -5.0894, lng: -81.1144 },
  "Máncora": { lat: -4.1033, lng: -81.0450 },
  
  // Cajamarca
  "Cajamarca Centro": { lat: -7.1611, lng: -78.5125 },
  "Jaén": { lat: -5.7081, lng: -78.8075 },
  "Chota": { lat: -6.5575, lng: -78.6525 },
  
  // Junín
  "Huancayo Centro": { lat: -12.0653, lng: -75.2049 },
  "Tarma Ciudad": { lat: -11.4189, lng: -75.6897 },
  "Jauja Ciudad": { lat: -11.7758, lng: -75.4978 },
  "Satipo": { lat: -11.2525, lng: -74.6394 },
  
  // Arequipa
  "Arequipa Centro": { lat: -16.4090, lng: -71.5375 },
  "Mollendo": { lat: -17.0236, lng: -72.0142 },
  "Camaná": { lat: -16.6244, lng: -72.7111 },
  
  // Cusco
  "Cusco Centro": { lat: -13.5319, lng: -71.9675 },
  "Urubamba": { lat: -13.3050, lng: -72.1167 },
  "Pisac": { lat: -13.4172, lng: -71.8469 },
  
  // Ica
  "Ica Centro": { lat: -14.0678, lng: -75.7286 },
  "Pisco": { lat: -13.7103, lng: -76.2053 },
  "Nazca": { lat: -14.8306, lng: -74.9378 },
  "Chincha": { lat: -13.4097, lng: -76.1331 },
  "Paracas": { lat: -13.8608, lng: -76.2508 },
  
  // Huánuco
  "Huánuco Centro": { lat: -9.9306, lng: -76.2422 },
  "Tingo María": { lat: -9.2950, lng: -75.9919 },
  
  // Ucayali
  "Pucallpa": { lat: -8.3791, lng: -74.5539 },
  
  // Loreto
  "Iquitos": { lat: -3.7437, lng: -73.2516 },
  
  // San Martín
  "Tarapoto": { lat: -6.4889, lng: -76.3675 },
  "Moyobamba": { lat: -6.0342, lng: -76.9711 },
  "Rioja": { lat: -6.0594, lng: -77.1681 },
  "Nueva Cajamarca": { lat: -5.9389, lng: -77.3083 }
};

// Función para cargar regiones
function cargarRegiones(selectId) {
  const select = document.getElementById(selectId);
  select.innerHTML = '<option value="">Seleccionar Región</option>';
  
  Object.keys(UBICACIONES_PERU).forEach(region => {
    const option = document.createElement('option');
    option.value = region;
    option.textContent = region;
    select.appendChild(option);
  });
}

// Función para cargar provincias basado en región
function cargarProvincias(region, selectId) {
  const select = document.getElementById(selectId);
  select.innerHTML = '<option value="">Seleccionar Provincia</option>';
  
  if (region && UBICACIONES_PERU[region]) {
    Object.keys(UBICACIONES_PERU[region]).forEach(provincia => {
      const option = document.createElement('option');
      option.value = provincia;
      option.textContent = provincia;
      select.appendChild(option);
    });
  }
}

// Función para cargar distritos basado en región y provincia
function cargarDistritos(region, provincia, selectId) {
  const select = document.getElementById(selectId);
  select.innerHTML = '<option value="">Seleccionar Distrito</option>';
  
  if (region && provincia && UBICACIONES_PERU[region] && UBICACIONES_PERU[region][provincia]) {
    Object.keys(UBICACIONES_PERU[region][provincia]).forEach(distrito => {
      const option = document.createElement('option');
      option.value = distrito;
      option.textContent = distrito;
      select.appendChild(option);
    });
  }
}

// Función para cargar ciudades basado en región, provincia y distrito
function cargarCiudades(region, provincia, distrito, selectId) {
  const select = document.getElementById(selectId);
  select.innerHTML = '<option value="">Seleccionar Ciudad</option>';
  
  if (region && provincia && distrito && 
      UBICACIONES_PERU[region] && 
      UBICACIONES_PERU[region][provincia] && 
      UBICACIONES_PERU[region][provincia][distrito]) {
    
    UBICACIONES_PERU[region][provincia][distrito].forEach(ciudad => {
      const option = document.createElement('option');
      option.value = ciudad;
      option.textContent = ciudad;
      select.appendChild(option);
    });
  }
}

// Función para calcular distancia entre dos puntos (fórmula de propia)
function calcularDistancia(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distanciaLineal = R * c;
  return distanciaLineal * 1.3; // Aproximación del 30% más por carreteras
}

// Función para calcular precio basado en distancia
function calcularPrecio(distanciaKm) {
  // Tarifa base: S/ 0.08 por km + tarifa mínima de S/ 10
  const tarifaPorKm = 0.08;
  const tarifaMinima = 10;
  const precio = Math.max(distanciaKm * tarifaPorKm, tarifaMinima);
  return Math.round(precio * 100) / 100; // Redondear a 2 decimales
}

// Función para calcular duración basado en distancia
function calcularDuracion(distanciaKm) {
  // Velocidad promedio de 60 km/h en carretera
  const velocidadPromedio = 60;
  const horas = distanciaKm / velocidadPromedio;
  const horasEnteras = Math.floor(horas);
  const minutos = Math.round((horas - horasEnteras) * 60);
  
  if (horasEnteras === 0) {
    return `${minutos} min`;
  } else if (minutos === 0) {
    return `${horasEnteras}h`;
  } else {
    return `${horasEnteras}h ${minutos}min`;
  }
}

// Función para actualizar precio y duración automáticamente (modo sugerencia)
function actualizarPrecioYDuracion() {
  const ciudadOrigen = document.getElementById('ciudadOrigen')?.value;
  const ciudadDestino = document.getElementById('ciudadDestino')?.value;
  
  if (ciudadOrigen && ciudadDestino && 
      COORDENADAS_CIUDADES[ciudadOrigen] && 
      COORDENADAS_CIUDADES[ciudadDestino]) {
    
    const coordOrigen = COORDENADAS_CIUDADES[ciudadOrigen];
    const coordDestino = COORDENADAS_CIUDADES[ciudadDestino];
    
    const distancia = calcularDistancia(
      coordOrigen.lat, coordOrigen.lng,
      coordDestino.lat, coordDestino.lng
    );
    
    const precioSugerido = calcularPrecio(distancia);
    const duracionSugerida = calcularDuracion(distancia);
    
    // Solo actualizar si los campos están vacíos o el usuario lo permite
    const campoDistancia = document.getElementById('distancia');
    const campoPrecio = document.getElementById('precio');
    const campoDuracion = document.getElementById('duracion');
    
    if (campoDistancia && !campoDistancia.value) {
      campoDistancia.value = Math.round(distancia);
    }
    
    if (campoPrecio && !campoPrecio.value) {
      campoPrecio.value = precioSugerido;
    }
    
    if (campoDuracion && !campoDuracion.value) {
      campoDuracion.value = duracionSugerida;
    }
    
    // Mostrar información de sugerencias
    const infoContainer = document.getElementById('infoRuta');
    if (infoContainer) {
      infoContainer.innerHTML = `
        <div class="alert alert-info">
          <h6><i class="fas fa-lightbulb"></i> Sugerencias calculadas:</h6>
          📍 Distancia: ${Math.round(distancia)} km<br>
          💰 Precio sugerido: S/ ${precioSugerido}<br>
          ⏱️ Duración estimada: ${duracionSugerida}<br>
          <small class="text-muted">Puedes editar estos valores manualmente</small>
          <br>
          <button type="button" class="btn btn-sm btn-outline-primary mt-2" onclick="aplicarSugerencias(${Math.round(distancia)}, ${precioSugerido}, '${duracionSugerida}')">
            <i class="fas fa-magic"></i> Aplicar Sugerencias
          </button>
        </div>
      `;
    }
  } else {
    // Limpiar info si no hay datos válidos
    const infoContainer = document.getElementById('infoRuta');
    if (infoContainer) {
      infoContainer.innerHTML = '';
    }
  }
}

// Función para aplicar sugerencias manualmente
function aplicarSugerencias(distancia, precio, duracion) {
  const campoDistancia = document.getElementById('distancia');
  const campoPrecio = document.getElementById('precio');
  const campoDuracion = document.getElementById('duracion');
  
  if (campoDistancia) campoDistancia.value = distancia;
  if (campoPrecio) campoPrecio.value = precio;
  if (campoDuracion) campoDuracion.value = duracion;
  
  // Ocultar el botón de sugerencias
  const infoContainer = document.getElementById('infoRuta');
  if (infoContainer) {
    infoContainer.innerHTML = `
      <div class="alert alert-success">
        <i class="fas fa-check"></i> Valores aplicados. Puedes editarlos manualmente si es necesario.
      </div>
    `;
  }
}

// Exportar funciones para uso global
window.cargarRegiones = cargarRegiones;
window.cargarProvincias = cargarProvincias;
window.cargarDistritos = cargarDistritos;
window.cargarCiudades = cargarCiudades;
window.actualizarPrecioYDuracion = actualizarPrecioYDuracion;
window.aplicarSugerencias = aplicarSugerencias;
window.calcularDistancia = calcularDistancia;
window.calcularPrecio = calcularPrecio;
window.calcularDuracion = calcularDuracion;
window.obtenerCoordenadas = function(ciudad) {
  return COORDENADAS_CIUDADES[ciudad] || null;
};

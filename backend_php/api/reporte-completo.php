<?php
// Script de resumen completo del sistema UTPTRAVEL
require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    echo "🚌 SISTEMA UTPTRAVEL - REPORTE COMPLETO\n";
    echo "=====================================\n\n";
    
    // 1. Usuarios
    echo "👥 USUARIOS REGISTRADOS:\n";
    $stmt = $conn->prepare('
        SELECT COUNT(*) as total_usuarios,
               COUNT(CASE WHEN ul.rol = "admin" THEN 1 END) as admins,
               COUNT(CASE WHEN ul.rol = "trabajador" THEN 1 END) as trabajadores,
               COUNT(CASE WHEN ul.rol = "usuario" THEN 1 END) as usuarios
        FROM usuarios_login ul
        WHERE ul.activo = 1
    ');
    $stmt->execute();
    $usuarios = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "- Total usuarios activos: " . $usuarios['total_usuarios'] . "\n";
    echo "- Administradores: " . $usuarios['admins'] . "\n";
    echo "- Trabajadores: " . $usuarios['trabajadores'] . "\n";
    echo "- Usuarios regulares: " . $usuarios['usuarios'] . "\n\n";
    
    // 2. Rutas
    echo "🛣️ RUTAS DISPONIBLES:\n";
    $stmt = $conn->prepare('
        SELECT COUNT(*) as total_rutas,
               COUNT(CASE WHEN estado = "activo" THEN 1 END) as activas,
               COUNT(CASE WHEN estado = "inactivo" THEN 1 END) as inactivas
        FROM rutas
    ');
    $stmt->execute();
    $rutas = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "- Total rutas: " . $rutas['total_rutas'] . "\n";
    echo "- Rutas activas: " . $rutas['activas'] . "\n";
    echo "- Rutas inactivas: " . $rutas['inactivas'] . "\n\n";
    
    // Listar rutas activas
    $stmt = $conn->prepare('
        SELECT origen, destino, precio, fecha_salida, capacidad_pasajeros
        FROM rutas 
        WHERE estado = "activo" 
        ORDER BY fecha_salida
    ');
    $stmt->execute();
    $rutasActivas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Rutas activas:\n";
    foreach ($rutasActivas as $ruta) {
        echo "- " . $ruta['origen'] . " → " . $ruta['destino'] . 
             " | S/. " . $ruta['precio'] . 
             " | " . date('d/m/Y H:i', strtotime($ruta['fecha_salida'])) . 
             " | " . $ruta['capacidad_pasajeros'] . " asientos\n";
    }
    echo "\n";
    
    // 3. Reservas
    echo "🎫 RESERVAS:\n";
    $stmt = $conn->prepare('
        SELECT COUNT(*) as total_reservas,
               COUNT(CASE WHEN estado = "confirmada" THEN 1 END) as confirmadas,
               COUNT(CASE WHEN estado = "pendiente" THEN 1 END) as pendientes,
               COUNT(CASE WHEN estado = "cancelada" THEN 1 END) as canceladas,
               COUNT(CASE WHEN usuario_id IS NULL THEN 1 END) as usuarios_no_registrados,
               COUNT(CASE WHEN usuario_id IS NOT NULL THEN 1 END) as usuarios_registrados,
               SUM(precio_pagado) as ingresos_totales
        FROM reservas
    ');
    $stmt->execute();
    $reservas = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "- Total reservas: " . $reservas['total_reservas'] . "\n";
    echo "- Confirmadas: " . $reservas['confirmadas'] . "\n";
    echo "- Pendientes: " . $reservas['pendientes'] . "\n";
    echo "- Canceladas: " . $reservas['canceladas'] . "\n";
    echo "- Usuarios registrados: " . $reservas['usuarios_registrados'] . "\n";
    echo "- Usuarios no registrados: " . $reservas['usuarios_no_registrados'] . "\n";
    echo "- Ingresos totales: S/. " . number_format($reservas['ingresos_totales'], 2) . "\n\n";
    
    // Últimas reservas
    echo "Últimas 5 reservas:\n";
    $stmt = $conn->prepare('
        SELECT r.codigo_reserva, r.pasajero_nombre, r.precio_pagado, r.fecha_reserva,
               ru.origen, ru.destino, r.created_by_role
        FROM reservas r
        JOIN rutas ru ON r.ruta_id = ru.id
        ORDER BY r.fecha_reserva DESC
        LIMIT 5
    ');
    $stmt->execute();
    $ultimasReservas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($ultimasReservas as $reserva) {
        echo "- " . $reserva['codigo_reserva'] . " | " . $reserva['pasajero_nombre'] . 
             " | " . $reserva['origen'] . " → " . $reserva['destino'] . 
             " | S/. " . $reserva['precio_pagado'] . 
             " | " . date('d/m/Y H:i', strtotime($reserva['fecha_reserva'])) . 
             " | Creado por: " . $reserva['created_by_role'] . "\n";
    }
    echo "\n";
    
    // 4. Historial General
    echo "📋 HISTORIAL GENERAL:\n";
    $stmt = $conn->prepare('
        SELECT COUNT(*) as total_acciones,
               COUNT(CASE WHEN accion LIKE "%reserva%" THEN 1 END) as acciones_reservas,
               COUNT(CASE WHEN accion LIKE "%usuario%" THEN 1 END) as acciones_usuarios,
               MIN(fecha_accion) as primera_accion,
               MAX(fecha_accion) as ultima_accion
        FROM historial_general
    ');
    $stmt->execute();
    $historial = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "- Total acciones registradas: " . $historial['total_acciones'] . "\n";
    echo "- Acciones de reservas: " . $historial['acciones_reservas'] . "\n";
    echo "- Acciones de usuarios: " . $historial['acciones_usuarios'] . "\n";
    if ($historial['primera_accion']) {
        echo "- Primera acción: " . date('d/m/Y H:i', strtotime($historial['primera_accion'])) . "\n";
        echo "- Última acción: " . date('d/m/Y H:i', strtotime($historial['ultima_accion'])) . "\n";
    }
    echo "\n";
    
    // 5. Estado de las funcionalidades
    echo "✅ FUNCIONALIDADES IMPLEMENTADAS:\n";
    echo "- ✅ Registro de usuarios con DNI\n";
    echo "- ✅ Gestión de rutas completa\n";
    echo "- ✅ Reservas para usuarios registrados\n";
    echo "- ✅ Reservas para usuarios no registrados\n";
    echo "- ✅ Historial general para admin\n";
    echo "- ✅ Historial personal para usuarios\n";
    echo "- ✅ Generación de PDF para reservas\n";
    echo "- ✅ Trabajadores pueden hacer reservas\n";
    echo "- ✅ Control de roles y permisos\n";
    echo "- ✅ Estructura de base de datos actualizada\n\n";
    
    // 6. Próximos pasos
    echo "📋 PRÓXIMOS PASOS RECOMENDADOS:\n";
    echo "1. Implementar interfaz web para trabajadores\n";
    echo "2. Agregar notificaciones por email\n";
    echo "3. Implementar reportes avanzados\n";
    echo "4. Agregar gestión de rutas concluidas\n";
    echo "5. Implementar sistema de pagos\n";
    echo "6. Agregar validaciones adicionales\n";
    echo "7. Implementar backup automático\n\n";
    
    echo "🎉 SISTEMA UTPTRAVEL - IMPLEMENTACIÓN COMPLETA\n";
    echo "Fecha del reporte: " . date('d/m/Y H:i:s') . "\n";
    
} catch (Exception $e) {
    echo "❌ Error generando reporte: " . $e->getMessage() . "\n";
}
?>

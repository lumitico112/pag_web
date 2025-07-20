<?php
require_once '../config/database.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

$db = new Database();
$conn = $db->getConnection();

// Crear tabla de rutas concluidas si no existe
$createTableSQL = "
CREATE TABLE IF NOT EXISTS rutas_concluidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ruta_id_original INT NOT NULL,
    origen VARCHAR(255) NOT NULL,
    destino VARCHAR(255) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    duracion VARCHAR(50),
    imagen VARCHAR(255),
    estado VARCHAR(50) DEFAULT 'concluida',
    origen_region VARCHAR(100),
    origen_provincia VARCHAR(100),
    origen_distrito VARCHAR(100),
    origen_ciudad VARCHAR(100),
    destino_region VARCHAR(100),
    destino_provincia VARCHAR(100),
    destino_distrito VARCHAR(100),
    destino_ciudad VARCHAR(100),
    distancia_km DECIMAL(10,2),
    capacidad_pasajeros INT DEFAULT 40,
    fecha_salida DATETIME,
    hora_salida TIME,
    fecha_llegada DATETIME,
    hora_llegada TIME,
    total_pasajeros_transportados INT DEFAULT 0,
    ingresos_generados DECIMAL(12,2) DEFAULT 0,
    fecha_conclusion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fecha_salida (fecha_salida),
    INDEX idx_origen_destino (origen, destino)
)";

try {
    $conn->exec($createTableSQL);
    // No hacer echo aquí, la tabla se crea silenciosamente
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al crear tabla: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if (isset($_GET['action']) && $_GET['action'] === 'proceso_vencidas') {
            // Procesar rutas vencidas automáticamente
            procesarRutasVencidas($conn);
        } elseif (isset($_GET['estadisticas'])) {
            // Obtener estadísticas de rutas concluidas
            obtenerEstadisticas($conn);
        } elseif (isset($_GET['id']) && isset($_GET['reporte'])) {
            // Generar reporte de una ruta específica
            generarReporteRuta($conn, $_GET['id']);
        } elseif (isset($_GET['id'])) {
            // Obtener detalles de una ruta específica
            obtenerDetalleRutaConcluida($conn, $_GET['id']);
        } else {
            // Obtener todas las rutas concluidas
            obtenerRutasConcluidas($conn);
        }
        break;
        
    case 'POST':
        // Mover ruta específica a concluidas manualmente (simple: copiar y eliminar)
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['ruta_id'] ?? $data['id'] ?? null;
        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID de ruta requerido']);
            break;
        }
        try {
            // Obtener la ruta original
            $stmt = $conn->prepare("SELECT * FROM rutas WHERE id = ?");
            $stmt->execute([$id]);
            $ruta = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$ruta) {
                throw new Exception('Ruta no encontrada');
            }
            // Insertar en rutas_concluidas
            $stmt = $conn->prepare("
                INSERT INTO rutas_concluidas (
                    ruta_id_original, origen, destino, origen_region, origen_provincia, origen_ciudad,
                    destino_region, destino_provincia, destino_ciudad, fecha_salida, hora_salida,
                    fecha_llegada, hora_llegada, precio, capacidad_pasajeros, asientos_disponibles,
                    duracion, distancia_km, descripcion, imagen, estado, total_pasajeros_transportados,
                    ingresos_generados
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $ruta['id'],
                $ruta['origen'],
                $ruta['destino'],
                $ruta['origen_region'],
                $ruta['origen_provincia'],
                $ruta['origen_ciudad'],
                $ruta['destino_region'],
                $ruta['destino_provincia'],
                $ruta['destino_ciudad'],
                $ruta['fecha_salida'],
                $ruta['hora_salida'],
                $ruta['fecha_llegada'],
                $ruta['hora_llegada'],
                $ruta['precio'],
                $ruta['capacidad_pasajeros'],
                $ruta['asientos_disponibles'] ?? 40,
                $ruta['duracion'],
                $ruta['distancia_km'],
                $ruta['descripcion'] ?? '',
                $ruta['imagen'],
                'concluido',
                0,
                0
            ]);
            // Eliminar la ruta original
            $conn->prepare("DELETE FROM rutas WHERE id = ?")->execute([$id]);
            echo json_encode(["success" => true, "message" => "Ruta movida correctamente a rutas_concluidas", "id" => $id]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        break;
}

function procesarRutasVencidas($conn) {
    try {
        // Buscar rutas que ya pasaron su fecha/hora de salida
        $sql = "SELECT r.*, 
                       COUNT(res.id) as total_reservas,
                       SUM(res.precio_pagado) as ingresos_total,
                       COUNT(res.id) as total_pasajeros
                FROM rutas r
                LEFT JOIN reservas res ON r.id = res.ruta_id AND res.estado_reserva = 'confirmada'
                WHERE r.estado = 'activo' 
                AND r.fecha_salida IS NOT NULL 
                AND r.fecha_salida < NOW()
                GROUP BY r.id";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $rutasVencidas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $rutasMovidas = 0;
        
        foreach ($rutasVencidas as $ruta) {
            if (moverRutaAConcluidas($conn, $ruta['id'], false, $ruta)) {
                $rutasMovidas++;
            }
        }
        
        echo json_encode([
            'message' => "Proceso completado. {$rutasMovidas} rutas movidas a concluidas",
            'rutas_procesadas' => $rutasMovidas,
            'rutas_encontradas' => count($rutasVencidas)
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error procesando rutas vencidas: ' . $e->getMessage()]);
    }
}

function moverRutaAConcluidas($conn, $rutaId, $manual = true, $datosRuta = null) {
    try {
        $conn->beginTransaction();
        
        // Obtener datos de la ruta si no se proporcionaron
        if (!$datosRuta) {
            $stmt = $conn->prepare("SELECT r.*, 
                                           COUNT(res.id) as total_reservas,
                                           SUM(res.precio_pagado) as ingresos_total,
                                           COUNT(res.id) as total_pasajeros
                                    FROM rutas r
                                    LEFT JOIN reservas res ON r.id = res.ruta_id AND res.estado_reserva = 'confirmada'
                                    WHERE r.id = ?
                                    GROUP BY r.id");
            $stmt->execute([$rutaId]);
            $datosRuta = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        if (!$datosRuta) {
            throw new Exception('Ruta no encontrada');
        }
        
        // Insertar en rutas concluidas
        $sqlInsert = "INSERT INTO rutas_concluidas (
            ruta_id_original, origen, destino, precio, duracion, imagen, estado,
            origen_region, origen_provincia, origen_ciudad,
            destino_region, destino_provincia, destino_ciudad,
            distancia_km, capacidad_pasajeros, fecha_salida, hora_salida, 
            fecha_llegada, hora_llegada, total_pasajeros_transportados, ingresos_generados,
            fecha_conclusion, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sqlInsert);
        $stmt->execute([
            $datosRuta['id'],
            $datosRuta['origen'],
            $datosRuta['destino'],
            $datosRuta['precio'],
            $datosRuta['duracion'],
            $datosRuta['imagen'],
            'concluida',
            $datosRuta['origen_region'] ?? null,
            $datosRuta['origen_provincia'] ?? null,
            $datosRuta['origen_ciudad'] ?? null,
            $datosRuta['destino_region'] ?? null,
            $datosRuta['destino_provincia'] ?? null,
            $datosRuta['destino_ciudad'] ?? null,
            $datosRuta['distancia_km'],
            $datosRuta['capacidad_pasajeros'],
            $datosRuta['fecha_salida'],
            date('H:i:s', strtotime($datosRuta['fecha_salida'])),
            $datosRuta['fecha_llegada'],
            $datosRuta['fecha_llegada'] ? date('H:i:s', strtotime($datosRuta['fecha_llegada'])) : null,
            $datosRuta['total_pasajeros'] ?? 0,
            $datosRuta['ingresos_total'] ?? 0,
            null, // fecha_conclusion
            null  // created_at
        ]);
        
        // Eliminar la ruta original de la tabla rutas
        $stmt = $conn->prepare("DELETE FROM rutas WHERE id = ?");
        $stmt->execute([$rutaId]);
        
        $conn->commit();
        
        if ($manual) {
            echo json_encode([
                'success' => true,
                'message' => 'Ruta movida a concluidas exitosamente'
            ]);
        }
        
        return true;
        
    } catch (Exception $e) {
        $conn->rollBack();
        
        if ($manual) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al mover ruta: ' . $e->getMessage()]);
        }
        
        return false;
    }
}

function obtenerRutasConcluidas($conn) {
    try {
        $sql = "SELECT * FROM rutas_concluidas ORDER BY fecha_conclusion DESC";
        
        if (isset($_GET['limit'])) {
            $limit = (int) $_GET['limit'];
            $sql .= " LIMIT $limit";
        }
        
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $rutas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($rutas);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al obtener rutas concluidas: ' . $e->getMessage()]);
    }
}

function obtenerDetalleRutaConcluida($conn, $id) {
    try {
        // Obtener los detalles de la ruta concluida
        $sql = "SELECT * FROM rutas_concluidas WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$id]);
        $ruta = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$ruta) {
            http_response_code(404);
            echo json_encode(['error' => 'Ruta concluida no encontrada']);
            return;
        }
        
        // Obtener las reservas asociadas a esta ruta (si existen)
        $sqlReservas = "
            SELECT r.*, COALESCE(r.pasajero_nombre, u.nombre) as nombre_pasajero, 
                   ul.email, r.pasajero_dni as dni
            FROM reservas r 
            LEFT JOIN usuarios u ON r.usuario_id = u.usuario_id
            LEFT JOIN usuarios_login ul ON r.usuario_id = ul.id
            WHERE r.ruta_id = ? 
            ORDER BY r.fecha_reserva DESC
        ";
        $stmtReservas = $conn->prepare($sqlReservas);
        $stmtReservas->execute([$ruta['ruta_id_original']]);
        $reservas = $stmtReservas->fetchAll(PDO::FETCH_ASSOC);
        
        // Calcular estadísticas adicionales
        $ocupacion_porcentaje = $ruta['capacidad_pasajeros'] > 0 
            ? ($ruta['total_pasajeros_transportados'] / $ruta['capacidad_pasajeros']) * 100 
            : 0;
            
        $precio_promedio_pasajero = $ruta['total_pasajeros_transportados'] > 0 
            ? $ruta['ingresos_generados'] / $ruta['total_pasajeros_transportados'] 
            : 0;
        
        $detalle = [
            'ruta' => $ruta,
            'reservas' => $reservas,
            'estadisticas' => [
                'ocupacion_porcentaje' => round($ocupacion_porcentaje, 2),
                'precio_promedio_pasajero' => round($precio_promedio_pasajero, 2),
                'asientos_disponibles' => $ruta['capacidad_pasajeros'] - $ruta['total_pasajeros_transportados'],
                'total_reservas' => count($reservas)
            ]
        ];
        
        echo json_encode($detalle);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al obtener detalle de ruta: ' . $e->getMessage()]);
    }
}

function obtenerEstadisticas($conn) {
    try {
        $stats = [];
        
        // Total de rutas concluidas
        $stmt = $conn->prepare("SELECT COUNT(*) as total FROM rutas_concluidas");
        $stmt->execute();
        $stats['total_rutas_concluidas'] = $stmt->fetchColumn();
        
        // Total de pasajeros transportados
        $stmt = $conn->prepare("SELECT SUM(total_pasajeros_transportados) as total FROM rutas_concluidas");
        $stmt->execute();
        $stats['total_pasajeros_transportados'] = $stmt->fetchColumn() ?? 0;
        
        // Total de ingresos generados
        $stmt = $conn->prepare("SELECT SUM(ingresos_generados) as total FROM rutas_concluidas");
        $stmt->execute();
        $stats['total_ingresos'] = $stmt->fetchColumn() ?? 0;
        
        // Estadísticas por mes
        $stmt = $conn->prepare("
            SELECT DATE_FORMAT(fecha_conclusion, '%Y-%m') as mes,
                   COUNT(*) as rutas,
                   SUM(total_pasajeros_transportados) as pasajeros,
                   SUM(ingresos_generados) as ingresos
            FROM rutas_concluidas 
            WHERE fecha_conclusion >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(fecha_conclusion, '%Y-%m')
            ORDER BY mes DESC
        ");
        $stmt->execute();
        $stats['por_mes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode($stats);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al obtener estadísticas: ' . $e->getMessage()]);
    }
}

function generarReporteRuta($conn, $rutaId) {
    try {
        // Obtener datos completos de la ruta concluida
        $stmt = $conn->prepare("
            SELECT rc.*, 
                   COUNT(r.id) as total_reservas,
                   SUM(r.precio_pagado) as ingresos_reales,
                   GROUP_CONCAT(DISTINCT r.pasajero_nombre SEPARATOR ', ') as pasajeros_nombres,
                   AVG(r.precio_pagado) as precio_promedio
            FROM rutas_concluidas rc
            LEFT JOIN reservas r ON r.ruta_id = rc.ruta_id_original
            WHERE rc.id = ?
            GROUP BY rc.id
        ");
        $stmt->execute([$rutaId]);
        $ruta = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$ruta) {
            http_response_code(404);
            echo json_encode(['error' => 'Ruta no encontrada']);
            return;
        }
        
        // Verificar si se solicita PDF
        if (isset($_GET['pdf']) && $_GET['pdf'] == '1') {
            // Incluir el generador de PDF
            require_once '../lib/PDFGenerator.php';
            
            // Generar PDF
            $pdfGenerator = new ReporteRutaPDF($ruta);
            $pdfContent = $pdfGenerator->generar();
            
            // Configurar headers para descarga de PDF
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="reporte_ruta_' . $ruta['id'] . '_' . date('Y-m-d_H-i-s') . '.pdf"');
            header('Content-Length: ' . strlen($pdfContent));
            header('Cache-Control: no-cache, no-store, must-revalidate');
            header('Pragma: no-cache');
            header('Expires: 0');
            
            echo $pdfContent;
            return;
        }
        
        // Generar reporte detallado en texto (para compatibilidad)
        $reporte = "=== REPORTE DETALLADO DE RUTA CONCLUIDA ===\n\n";
        $reporte .= "ID Ruta: " . $ruta['id'] . "\n";
        $reporte .= "Ruta Original ID: " . $ruta['ruta_id_original'] . "\n";
        $reporte .= "Origen: " . $ruta['origen'] . "\n";
        $reporte .= "Destino: " . $ruta['destino'] . "\n\n";
        
        $reporte .= "=== INFORMACIÓN DEL VIAJE ===\n";
        $reporte .= "Fecha de Salida: " . ($ruta['fecha_salida'] ? date('d/m/Y H:i', strtotime($ruta['fecha_salida'])) : 'No especificada') . "\n";
        $reporte .= "Fecha de Llegada: " . ($ruta['fecha_llegada'] ? date('d/m/Y H:i', strtotime($ruta['fecha_llegada'])) : 'No especificada') . "\n";
        $reporte .= "Duración: " . ($ruta['duracion'] ?: 'No especificada') . "\n";
        $reporte .= "Distancia: " . ($ruta['distancia_km'] ? $ruta['distancia_km'] . ' km' : 'No especificada') . "\n";
        $reporte .= "Precio Base: S/. " . number_format($ruta['precio'], 2) . "\n\n";
        
        $reporte .= "=== CAPACIDAD Y OCUPACIÓN ===\n";
        $reporte .= "Capacidad Total: " . $ruta['capacidad_pasajeros'] . " pasajeros\n";
        $reporte .= "Reservas Realizadas: " . ($ruta['total_reservas'] ?: 0) . "\n";
        $reporte .= "Ocupación: " . ($ruta['capacidad_pasajeros'] > 0 ? round(($ruta['total_reservas'] ?: 0) / $ruta['capacidad_pasajeros'] * 100, 1) : 0) . "%\n\n";
        
        $reporte .= "=== INFORMACIÓN FINANCIERA ===\n";
        $reporte .= "Ingresos Potenciales: S/. " . number_format($ruta['precio'] * $ruta['capacidad_pasajeros'], 2) . "\n";
        $reporte .= "Ingresos Reales: S/. " . number_format($ruta['ingresos_reales'] ?: 0, 2) . "\n";
        $reporte .= "Precio Promedio por Reserva: S/. " . number_format($ruta['precio_promedio'] ?: 0, 2) . "\n";
        $reporte .= "Eficiencia de Ingresos: " . ($ruta['precio'] * $ruta['capacidad_pasajeros'] > 0 ? round(($ruta['ingresos_reales'] ?: 0) / ($ruta['precio'] * $ruta['capacidad_pasajeros']) * 100, 1) : 0) . "%\n\n";
        
        $reporte .= "=== FECHAS IMPORTANTES ===\n";
        $reporte .= "Fecha de Conclusión: " . date('d/m/Y H:i', strtotime($ruta['fecha_conclusion'])) . "\n";
        $reporte .= "Fecha de Registro: " . date('d/m/Y H:i', strtotime($ruta['created_at'])) . "\n\n";
        
        if ($ruta['pasajeros_nombres']) {
            $reporte .= "=== PASAJEROS REGISTRADOS ===\n";
            $reporte .= $ruta['pasajeros_nombres'] . "\n\n";
        }
        
        $reporte .= "=== UBICACIÓN DETALLADA ===\n";
        if ($ruta['origen_region'] || $ruta['origen_provincia']) {
            $reporte .= "Origen Completo: " . trim($ruta['origen_region'] . ", " . $ruta['origen_provincia'] . ", " . $ruta['origen_distrito'], ", ") . "\n";
        }
        if ($ruta['destino_region'] || $ruta['destino_provincia']) {
            $reporte .= "Destino Completo: " . trim($ruta['destino_region'] . ", " . $ruta['destino_provincia'] . ", " . $ruta['destino_distrito'], ", ") . "\n";
        }
        
        $reporte .= "\n=== ESTADO FINAL ===\n";
        $reporte .= "Estado: " . strtoupper($ruta['estado']) . "\n";
        $reporte .= "Sistema: UTPTRAVEL\n";
        $reporte .= "Generado: " . date('d/m/Y H:i:s') . "\n";
        
        // Devolver respuesta exitosa con datos del reporte
        echo json_encode([
            'success' => true,
            'reportData' => $reporte,
            'rutaInfo' => [
                'id' => $ruta['id'],
                'origen' => $ruta['origen'],
                'destino' => $ruta['destino'],
                'total_reservas' => $ruta['total_reservas'] ?: 0,
                'ingresos_reales' => $ruta['ingresos_reales'] ?: 0,
                'ocupacion_porcentaje' => $ruta['capacidad_pasajeros'] > 0 ? round(($ruta['total_reservas'] ?: 0) / $ruta['capacidad_pasajeros'] * 100, 1) : 0
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al generar reporte: ' . $e->getMessage()]);
    }
}
?>

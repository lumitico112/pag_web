<?php
require_once '../config/database.php';

// Manejo de errores básico - solo para errores realmente fatales
function handleFatalError() {
    $error = error_get_last();
    if ($error !== NULL && $error['type'] === E_ERROR) {
        // Solo para errores realmente fatales, no warnings o notices
        if (!headers_sent() && ob_get_length() === false) {
            http_response_code(500);
            echo json_encode(['error' => 'Error crítico del servidor']);
        }
    }
}
register_shutdown_function('handleFatalError');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Protección para ejecución desde línea de comandos
if (!isset($_SERVER['REQUEST_METHOD'])) {
    $_SERVER['REQUEST_METHOD'] = 'GET';
}

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    if (!$conn) {
        throw new Exception('No se pudo conectar a la base de datos');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión: ' . $e->getMessage()]);
    exit;
}

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            // Obtener ruta específica
            $stmt = $conn->prepare('SELECT * FROM rutas WHERE id = ?');
            $stmt->execute([$_GET['id']]);
            $ruta = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($ruta) {
                echo json_encode([
                    'success' => true,
                    'ruta' => $ruta
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'error' => 'Ruta no encontrada'
                ]);
            }
        } else {
            // Obtener todas las rutas con información de reservas
            try {
                // PRIMERO: Verificar y mover rutas vencidas a concluidas automáticamente
                verificarYMoverRutasVencidas($conn);
                
                $sql = "SELECT r.*, 
                        COALESCE(COUNT(res.id), 0) as reservas_count,
                        (r.capacidad_pasajeros - COALESCE(COUNT(res.id), 0)) as disponibles
                        FROM rutas r
                        LEFT JOIN reservas res ON r.id = res.ruta_id AND res.estado_reserva = 'confirmada'
                        WHERE r.estado = 'activo'
                        GROUP BY r.id
                        ORDER BY r.fecha_salida ASC";
                $stmt = $conn->prepare($sql);
                $stmt->execute();
                $rutas = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Procesar campos de fecha para compatibilidad solo si hay rutas
                if (!empty($rutas)) {
                    foreach ($rutas as &$ruta) {
                        // Si tenemos fecha_salida como datetime, extraer las partes
                        if (!empty($ruta['fecha_salida'])) {
                            try {
                                $fechaDateTime = new DateTime($ruta['fecha_salida']);
                                $ruta['fecha_salida'] = $fechaDateTime->format('Y-m-d');
                                if (empty($ruta['hora_salida'])) {
                                    $ruta['hora_salida'] = $fechaDateTime->format('H:i:s');
                                }
                            } catch (Exception $e) {
                                // Mantener fecha original si hay error
                                error_log('Error procesando fecha: ' . $e->getMessage());
                            }
                        }
                        
                        // Asegurar campos necesarios
                        $ruta['capacidad'] = $ruta['capacidad_pasajeros'] ?? 40;
                        $ruta['distancia'] = $ruta['distancia_km'] ?? 0;
                    }
                }
                
                echo json_encode([
                    'success' => true,
                    'rutas' => $rutas,
                    'total' => count($rutas)
                ]);
                
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'error' => 'Error al obtener las rutas: ' . $e->getMessage()
                ]);
            }
        }
        break;
        
    case 'POST':
        // Mover ruta a concluidas y eliminar de rutas (igual que test-mover)
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "ID de ruta requerido"]);
            break;
        }
        try {
            $stmt = $conn->prepare("SELECT * FROM rutas WHERE id = ?");
            $stmt->execute([$data['id']]);
            $ruta = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$ruta) {
                throw new Exception("No se encontró la ruta con id " . $data['id']);
            }
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
                $ruta['asientos_disponibles'],
                $ruta['duracion'],
                $ruta['distancia_km'],
                $ruta['descripcion'],
                $ruta['imagen'],
                'concluido',
                0,
                0
            ]);
            $conn->prepare("DELETE FROM rutas WHERE id = ?")->execute([$data['id']]);
            echo json_encode(["success" => true, "message" => "Ruta movida correctamente a rutas_concluidas", "id" => $data['id']]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
        break;
        
    case 'PUT':
        // Actualizar ruta existente
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['id'])) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "error" => "ID de ruta requerido"
            ]);
            break;
        }
        
        $sql = "UPDATE rutas SET 
                    origen = ?, destino = ?, precio = ?, duracion = ?, imagen = ?, estado = ?,
                    origen_region = ?, origen_provincia = ?, origen_ciudad = ?,
                    destino_region = ?, destino_provincia = ?, destino_ciudad = ?,
                    distancia_km = ?, capacidad_pasajeros = ?, fecha_salida = ?, hora_salida = ?, 
                    fecha_llegada = ?, hora_llegada = ?
                WHERE id = ?";
        
        $stmt = $conn->prepare($sql);
        $result = $stmt->execute([
            $data['origen'] ?? '',
            $data['destino'] ?? '',
            $data['precio'] ?? 0,
            $data['duracion'] ?? '',
            $data['imagen'] ?? '',
            $data['estado'] ?? 'activo',
            $data['origen_region'] ?? '',
            $data['origen_provincia'] ?? '',
            $data['origen_ciudad'] ?? '',
            $data['destino_region'] ?? '',
            $data['destino_provincia'] ?? '',
            $data['destino_ciudad'] ?? '',
            $data['distancia_km'] ?? 0,
            $data['capacidad_pasajeros'] ?? 40,
            !empty($data['fecha_salida']) ? $data['fecha_salida'] . ' ' . ($data['hora_salida'] ?? '00:00:00') : null,
            $data['hora_salida'] ?? null,
            !empty($data['fecha_llegada']) ? $data['fecha_llegada'] . ' ' . ($data['hora_llegada'] ?? '00:00:00') : null,
            $data['hora_llegada'] ?? null,
            $data['id']
        ]);
        
        if ($result) {
            echo json_encode([
                "success" => true,
                "message" => "Ruta actualizada correctamente"
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "error" => "Error al actualizar la ruta"
            ]);
        }
        break;
        
    case 'DELETE':
        // Eliminar ruta
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "ID de ruta requerido"]);
            break;
        }
        
        // Verificar si tiene reservas
        $stmt = $conn->prepare('SELECT COUNT(*) FROM reservas WHERE ruta_id = ?');
        $stmt->execute([$_GET['id']]);
        $reservas = $stmt->fetchColumn();
        
        if ($reservas > 0) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "No se puede eliminar una ruta con reservas activas"]);
            break;
        }
        
        $stmt = $conn->prepare('DELETE FROM rutas WHERE id = ?');
        $result = $stmt->execute([$_GET['id']]);
        
        if ($result) {
            echo json_encode(["success" => true, "message" => "Ruta eliminada correctamente"]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Error al eliminar la ruta"]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(["error" => "Método no permitido"]);
        break;
}

// Función para mover una ruta recién creada a concluidas
function moverRutaRecienCreadaAConcluidas($conn, $rutaId, $datosRuta) {
    try {
        // Crear tabla de rutas concluidas si no existe - FUERA de la transacción
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
            /* origen_distrito eliminado */
            origen_ciudad VARCHAR(100),
            destino_region VARCHAR(100),
            destino_provincia VARCHAR(100),
            /* destino_distrito eliminado */
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
        
        // Crear una nueva conexión temporal para crear la tabla
        $tempConn = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
        $tempConn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $tempConn->exec($createTableSQL);
        $tempConn = null; // Cerrar conexión temporal
        
        // Preparar los datos para la inserción
        $origen = $datosRuta['origen'] ?? '';
        $destino = $datosRuta['destino'] ?? '';
        $precio = floatval($datosRuta['precio'] ?? 0);
        $duracion = $datosRuta['duracion'] ?? '';
        $imagen = $datosRuta['imagen'] ?? '';
        $estado = 'concluida';
        
        // Datos de ubicación
        $origen_region = $datosRuta['origen_region'] ?? null;
        $origen_provincia = $datosRuta['origen_provincia'] ?? null;
        // $origen_distrito eliminado
        $origen_ciudad = $datosRuta['origen_ciudad'] ?? null;
        $destino_region = $datosRuta['destino_region'] ?? null;
        $destino_provincia = $datosRuta['destino_provincia'] ?? null;
        // $destino_distrito eliminado
        $destino_ciudad = $datosRuta['destino_ciudad'] ?? null;
        
        // Datos numéricos
        $distancia_km = floatval($datosRuta['distancia_km'] ?? 0);
        $capacidad_pasajeros = intval($datosRuta['capacidad_pasajeros'] ?? 40);
        
        // Fechas - manejo simplificado
        $fecha_salida = null;
        if (!empty($datosRuta['fecha_salida'])) {
            $fecha_salida = $datosRuta['fecha_salida'];
            if (!empty($datosRuta['hora_salida'])) {
                $fecha_salida .= ' ' . $datosRuta['hora_salida'];
            } else {
                $fecha_salida .= ' 00:00:00';
            }
        }
        
        $fecha_llegada = null;
        if (!empty($datosRuta['fecha_llegada'])) {
            $fecha_llegada = $datosRuta['fecha_llegada'];
            if (!empty($datosRuta['hora_llegada'])) {
                $fecha_llegada .= ' ' . $datosRuta['hora_llegada'];
            } else {
                $fecha_llegada .= ' 00:00:00';
            }
        }
        
        $hora_salida = $datosRuta['hora_salida'] ?? null;
        $hora_llegada = $datosRuta['hora_llegada'] ?? null;
        
        // Insertar en rutas concluidas
        $sqlInsert = "INSERT INTO rutas_concluidas (
            ruta_id_original, origen, destino, origen_region, origen_provincia, origen_ciudad,
            destino_region, destino_provincia, destino_ciudad, fecha_salida, hora_salida,
            fecha_llegada, hora_llegada, precio, capacidad_pasajeros, asientos_disponibles,
            duracion, distancia_km, descripcion, imagen, estado, total_pasajeros_transportados,
            ingresos_generados, fecha_conclusion, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $conn->prepare($sqlInsert);
        if (!$stmt) {
            throw new Exception('Error al preparar la consulta: ' . implode(', ', $conn->errorInfo()));
        }
        
        $params = [
            $rutaId,
            $origen,
            $destino,
            $origen_region,
            $origen_provincia,
            $origen_ciudad,
            $destino_region,
            $destino_provincia,
            $destino_ciudad,
            $fecha_salida,
            $hora_salida,
            $fecha_llegada,
            $hora_llegada,
            $precio,
            $capacidad_pasajeros,
            $datosRuta['asientos_disponibles'] ?? 40,
            $duracion,
            $distancia_km,
            $datosRuta['descripcion'] ?? '',
            $imagen,
            $estado,
            0, // total_pasajeros_transportados
            0, // ingresos_generados
            null, // fecha_conclusion
            null  // created_at
        ];
        
        error_log("DEBUG: Ejecutando inserción con " . count($params) . " parámetros");
        
        $result = $stmt->execute($params);
        
        if (!$result) {
            $errorInfo = $stmt->errorInfo();
            throw new Exception('Error al insertar en rutas_concluidas: ' . implode(', ', $errorInfo));
        }
        
        // Cambiar estado de la ruta original a 'inactivo' (no 'concluida' porque la tabla rutas solo acepta ENUM('activo','inactivo'))
        $stmt = $conn->prepare("UPDATE rutas SET estado = 'inactivo' WHERE id = ?");
        $result = $stmt->execute([$rutaId]);
        
        if (!$result) {
            $errorInfo = $stmt->errorInfo();
            throw new Exception('Error al actualizar estado de ruta original: ' . implode(', ', $errorInfo));
        }
        
        return true;
        
    } catch (Exception $e) {
        return false; // Retornar false en lugar de lanzar excepción
    }
}

// Función para verificar y mover automáticamente las rutas vencidas a concluidas
function verificarYMoverRutasVencidas($conn) {
    try {
        // Buscar rutas activas que ya hayan vencido
        $sql = "SELECT * FROM rutas 
                WHERE estado = 'activo' 
                AND fecha_llegada IS NOT NULL 
                AND CONCAT(fecha_llegada, ' ', COALESCE(hora_llegada, '23:59:59')) < NOW()";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $rutasVencidas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $rutasMovidas = 0;
        
        foreach ($rutasVencidas as $ruta) {
            // Convertir los datos de la ruta al formato esperado por la función
            $datosRuta = [
                'id' => $ruta['id'],
                'origen' => $ruta['origen'] ?? '',
                'destino' => $ruta['destino'] ?? '',
                'origen_region' => $ruta['origen_region'] ?? '',
                'origen_provincia' => $ruta['origen_provincia'] ?? '',
                'origen_ciudad' => $ruta['origen_ciudad'] ?? '',
                'destino_region' => $ruta['destino_region'] ?? '',
                'destino_provincia' => $ruta['destino_provincia'] ?? '',
                'destino_ciudad' => $ruta['destino_ciudad'] ?? '',
                'fecha_salida' => !empty($ruta['fecha_salida']) ? $ruta['fecha_salida'] : date('Y-m-d'),
                'hora_salida' => !empty($ruta['hora_salida']) ? $ruta['hora_salida'] : '00:00:00',
                'fecha_llegada' => !empty($ruta['fecha_llegada']) ? $ruta['fecha_llegada'] : date('Y-m-d'),
                'hora_llegada' => !empty($ruta['hora_llegada']) ? $ruta['hora_llegada'] : '00:00:00',
                'precio' => $ruta['precio'] ?? 0,
                'duracion' => $ruta['duracion'] ?? '',
                'imagen' => $ruta['imagen'] ?? '',
                'distancia_km' => $ruta['distancia_km'] ?? 0,
                'capacidad_pasajeros' => $ruta['capacidad_pasajeros'] ?? 40,
                'asientos_disponibles' => $ruta['asientos_disponibles'] ?? 40,
                'descripcion' => $ruta['descripcion'] ?? '',
            ];
            
            // Mover la ruta a concluidas
            $resultado = moverRutaRecienCreadaAConcluidas($conn, $ruta['id'], $datosRuta);
            
            if ($resultado) {
                $rutasMovidas++;
            }
        }
        
        // Log para debug (opcional)
        if ($rutasMovidas > 0) {
            error_log("Sistema automático: $rutasMovidas rutas vencidas movidas a concluidas");
        }
        
        return $rutasMovidas;
        
    } catch (Exception $e) {
        error_log("Error en verificarYMoverRutasVencidas: " . $e->getMessage());
        return 0;
    }
}
?>

<?php
// Solución cross-platform para getallheaders
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

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
        if (isset($_GET['action']) && $_GET['action'] === 'historial') {
            // Historial de compras del usuario autenticado
            $headers = getallheaders();
            $auth_header = isset($headers['Authorization']) ? $headers['Authorization'] : '';
            if (!empty($auth_header)) {
                $token = str_replace('Bearer ', '', $auth_header);
                $decoded = base64_decode($token);
                $parts = explode(':', $decoded);
                $usuario_id = $parts[0];
                $stmt = $conn->prepare('
                    SELECT r.*, ru.origen, ru.destino, ru.fecha_salida,
                           u.nombres as usuario_nombre,
                           ul.role as usuario_rol
                    FROM reservas r
                    JOIN rutas ru ON r.ruta_id = ru.id
                    LEFT JOIN usuarios u ON r.usuario_id = u.id
                    LEFT JOIN usuarios_login ul ON r.usuario_id = ul.id
                    WHERE r.usuario_id = ?
                    ORDER BY r.fecha_reserva DESC
                ');
                $stmt->execute([$usuario_id]);
                $historial = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'historial' => $historial]);
            } else {
                http_response_code(401);
                echo json_encode(['error' => 'Token requerido']);
            }
        } else if (isset($_GET['id'])) {
            // Obtener reserva específica
            $stmt = $conn->prepare('
                SELECT r.*, ru.origen, ru.destino, ru.fecha_salida, ru.fecha_llegada,
                       COALESCE(r.pasajero_nombre, u.nombre) as usuario_nombre,
                       ul.role as usuario_rol
                FROM reservas r 
                JOIN rutas ru ON r.ruta_id = ru.id 
                LEFT JOIN usuarios u ON r.usuario_id = u.id
                LEFT JOIN usuarios_login ul ON r.usuario_id = ul.id
                WHERE r.id = ?
            ');
            $stmt->execute([$_GET['id']]);
            $reserva = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($reserva) {
                echo json_encode(['success' => true, 'reserva' => $reserva]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Reserva no encontrada']);
            }
        } elseif (isset($_GET['ruta_id'])) {
            // Obtener reservas por ruta
            $stmt = $conn->prepare('
                SELECT r.*, ru.origen, ru.destino, ru.fecha_salida
                FROM reservas r 
                JOIN rutas ru ON r.ruta_id = ru.id 
                WHERE r.ruta_id = ? AND r.estado_reserva = "confirmada"
                ORDER BY r.fecha_reserva DESC
            ');
            $stmt->execute([$_GET['ruta_id']]);
            $reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'reservas' => $reservas]);
        } elseif (isset($_GET['usuario_id'])) {
            // Obtener reservas de un usuario específico (compatibilidad)
            $stmt = $conn->prepare('
                SELECT r.*, ru.origen, ru.destino, ru.fecha_salida
                FROM reservas r 
                JOIN rutas ru ON r.ruta_id = ru.id 
                WHERE r.usuario_id = ?
                ORDER BY r.fecha_reserva DESC
            ');
            $stmt->execute([$_GET['usuario_id']]);
            $reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'reservas' => $reservas]);
        } elseif (isset($_GET['fecha'])) {
            // Obtener reservas de una fecha específica
            $stmt = $conn->prepare('
                SELECT r.*, ru.origen, ru.destino, ru.fecha_salida
                FROM reservas r 
                JOIN rutas ru ON r.ruta_id = ru.id 
                WHERE DATE(r.fecha_reserva) = ?
                ORDER BY r.fecha_reserva DESC
            ');
            $stmt->execute([$_GET['fecha']]);
            $reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'reservas' => $reservas]);
        } elseif (isset($_GET['limit'])) {
            // Obtener reservas recientes con límite
            $limit = intval($_GET['limit']);
            $stmt = $conn->prepare(
                'SELECT r.*, ru.origen, ru.destino, ru.fecha_salida,
                       COALESCE(r.pasajero_nombre, CONCAT(u.nombres, " ", u.apellidos)) as usuario_nombre,
                       ul.role as usuario_rol
                 FROM reservas r
                 JOIN rutas ru ON r.ruta_id = ru.id
                 LEFT JOIN usuarios u ON r.usuario_id = u.id
                 LEFT JOIN usuarios_login ul ON r.usuario_id = ul.id
                 ORDER BY r.fecha_reserva DESC
                 LIMIT :limit'
            );
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            $reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'reservas' => $reservas]);
        } else {
            // Obtener todas las reservas con información básica
            $stmt = $conn->prepare('
                SELECT r.*, ru.origen, ru.destino, ru.fecha_salida,
                       COALESCE(r.pasajero_nombre, CONCAT(u.nombres, " ", u.apellidos)) as usuario_nombre,
                       ul.role as usuario_rol
                FROM reservas r 
                JOIN rutas ru ON r.ruta_id = ru.id 
                LEFT JOIN usuarios u ON r.usuario_id = u.id
                LEFT JOIN usuarios_login ul ON r.usuario_id = ul.id
                ORDER BY r.fecha_reserva DESC
            ');
            $stmt->execute();
            $reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'reservas' => $reservas]);
        }
        break;
        
    case 'POST':
        // --- FLUJO SIMPLIFICADO PARA RESERVA DESDE FRONTEND (solo campos existentes) ---
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['ruta_id'], $data['cantidad_pasajeros'], $data['pasajeros']) || !is_array($data['pasajeros']) || count($data['pasajeros']) < 1) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Datos incompletos para la reserva']);
            break;
        }
        try {
            $conn->beginTransaction();
            // Obtener datos de la ruta y calcular asientos disponibles
            $stmt = $conn->prepare('SELECT r.precio, r.fecha_salida, r.estado, r.origen, r.destino, r.capacidad_pasajeros, COUNT(res.id) as reservados FROM rutas r LEFT JOIN reservas res ON r.id = res.ruta_id AND res.estado_reserva = "confirmada" WHERE r.id = ? GROUP BY r.id');
            $stmt->execute([$data['ruta_id']]);
            $ruta = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$ruta) throw new Exception('Ruta no encontrada');
            if ($ruta['estado'] !== 'activo') throw new Exception('La ruta no está activa');
            $capacidad = intval($ruta['capacidad_pasajeros']);
            $reservados = intval($ruta['reservados']);
            $disponibles = $capacidad - $reservados;
            if ($disponibles < intval($data['cantidad_pasajeros'])) throw new Exception('No hay asientos suficientes disponibles');
            // Calcular precio total
            $precio_base = floatval($ruta['precio']);
            $precio_total = $precio_base * intval($data['cantidad_pasajeros']);
            // Generar código de reserva único
            do {
                $codigo_reserva = 'UTP' . date('Ymd') . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 5));
                $stmt = $conn->prepare('SELECT id FROM reservas WHERE codigo_reserva = ?');
                $stmt->execute([$codigo_reserva]);
            } while ($stmt->fetch());
            // Tomar solo el primer pasajero
            $pasajero = $data['pasajeros'][0];
            $pasajero_nombre = $pasajero['nombre'] ?? '';
            $dni_pasajero = $pasajero['documento'] ?? '';
            $email_pasajero = $pasajero['correo'] ?? '';
            $telefono_pasajero = $pasajero['telefono'] ?? '';
            $usuario_id = isset($data['usuario_id']) ? intval($data['usuario_id']) : null;
            $fecha_viaje = $ruta['fecha_salida'] ?? null;
            // Insertar reserva SOLO con los campos correctos y estado_reserva 'confirmada'
            $stmt = $conn->prepare('INSERT INTO reservas (codigo_reserva, ruta_id, cantidad_pasajeros, pasajero_nombre, dni_pasajero, email_pasajero, telefono_pasajero, usuario_id, precio_total, fecha_viaje, estado, estado_reserva, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())');
            $estado = 'activo';
            $estado_reserva = 'confirmada';
            $stmt->execute([
                $codigo_reserva,
                $data['ruta_id'],
                $data['cantidad_pasajeros'],
                $pasajero_nombre,
                $dni_pasajero,
                $email_pasajero,
                $telefono_pasajero,
                $usuario_id,
                $precio_total,
                $fecha_viaje,
                $estado,
                $estado_reserva
            ]);
            $reserva_id = $conn->lastInsertId();
            $conn->commit();
            echo json_encode([
                'success' => true,
                'reserva_id' => $reserva_id,
                'codigo_reserva' => $codigo_reserva,
                'precio_total' => $precio_total
            ]);
        } catch (Exception $e) {
            $conn->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
        }
        break;
        
    case 'PUT':
        // Actualizar estado de reserva
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['id']) || !isset($data['estado_reserva'])) {
            http_response_code(400);
            echo json_encode(["error" => "ID y estado_reserva son requeridos"]);
            break;
        }
        
        $stmt = $conn->prepare("UPDATE reservas SET estado_reserva = ? WHERE id = ?");
        $result = $stmt->execute([$data['estado_reserva'], $data['id']]);
        
        if ($result) {
            echo json_encode(["message" => "Estado de reserva actualizado"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error al actualizar la reserva"]);
        }
        break;
        
    case 'DELETE':
        // Cancelar reserva
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(["error" => "ID de reserva requerido"]);
            break;
        }
        
        // En lugar de eliminar, marcar como cancelada
        $stmt = $conn->prepare("UPDATE reservas SET estado_reserva = 'cancelada' WHERE id = ?");
        $result = $stmt->execute([$_GET['id']]);
        
        if ($result) {
            echo json_encode(["message" => "Reserva cancelada correctamente"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error al cancelar la reserva"]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(["error" => "Método no permitido"]);
        break;
}
?>

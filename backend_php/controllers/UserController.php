<?php
require_once '../config/database.php';

class UserController {
    private $conn;
    private $table_usuarios = 'usuarios';
    private $table_usuarios_login = 'usuarios_login';

    public function __construct() {
        try {
            $database = new Database();
            $this->conn = $database->getConnection();
            
            if (!$this->conn) {
                throw new Exception('No se pudo conectar a la base de datos');
            }
        } catch (Exception $e) {
            error_log('Error en UserController constructor: ' . $e->getMessage());
            throw new Exception('Error al inicializar UserController');
        }
    }

    public function guardarRegistro($data) {
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST');
        header('Access-Control-Allow-Headers: Content-Type');

        try {
            // Extraer datos
            $nombre_completo = $data['nombre'];
            $dni = $data['dni'] ?? '';
            $email = $data['email'];
            // Log de depuración para ver el JSON recibido
            file_put_contents(__DIR__ . '/../api/debug_registro.log', date('Y-m-d H:i:s') . ' | input: ' . json_encode($data) . PHP_EOL, FILE_APPEND);
            $password = $data['password'];
            // Log de depuración para ver el valor recibido de password
            file_put_contents(__DIR__ . '/../api/debug_registro.log', date('Y-m-d H:i:s') . ' | password recibido: ' . var_export($password, true) . PHP_EOL, FILE_APPEND);
            $telefono = $data['telefono'];
            $fecha_nacimiento = $data['fecha_nacimiento'];
            $genero = $data['genero'];
            $direccion_principal = $data['direccion_principal'];
            $pais = $data['pais'];
            $username = $data['username'];

            // Separar nombres y apellidos (asume formato: "Nombres Apellidos")
            $partes = preg_split('/\s+/', trim($nombre_completo));
            $nombres = '';
            $apellidos = '';
            if (count($partes) > 1) {
                $nombres = array_shift($partes);
                $apellidos = implode(' ', $partes);
            } else {
                $nombres = $nombre_completo;
                $apellidos = '';
            }

            // Validar DNI
            if (!preg_match('/^\d{8}$/', $dni)) {
                http_response_code(400);
                echo json_encode(array("error" => "DNI debe tener exactamente 8 dígitos"));
                return;
            }

            // Verificar si el usuario ya existe por email
            $query_check = "SELECT * FROM " . $this->table_usuarios_login . " WHERE email = ?";
            $stmt_check = $this->conn->prepare($query_check);
            $stmt_check->execute([$email]);

            if ($stmt_check->rowCount() > 0) {
                http_response_code(409);
                echo json_encode(array("error" => "El email ya está registrado"));
                return;
            }

            // Verificar si el DNI ya existe
            $query_check_dni = "SELECT * FROM " . $this->table_usuarios . " WHERE dni = ?";
            $stmt_check_dni = $this->conn->prepare($query_check_dni);
            $stmt_check_dni->execute([$dni]);

            if ($stmt_check_dni->rowCount() > 0) {
                http_response_code(409);
                echo json_encode(array("error" => "El DNI ya está registrado"));
                return;
            }

            // Hashear contraseña
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

            // Iniciar transacción
            $this->conn->beginTransaction();

            // Insertar en usuarios_login (agregando role por defecto)
            $query_login = "INSERT INTO usuarios_login (email, password, role) VALUES (?, ?, ?)";
            $stmt_login = $this->conn->prepare($query_login);
            $stmt_login->execute([$email, $hashedPassword, 'usuario']);
            
            $usuario_id = $this->conn->lastInsertId();

            // Insertar en usuarios (usando los nombres correctos de columnas)
            $direccion_final = $direccion_principal;
            if ($genero) {
                $direccion_final = $direccion_principal;
            }
            // Guardar genero y pais en sus columnas, no en direccion
            $query_usuarios = "INSERT INTO " . $this->table_usuarios . " 
                (user_login_id, nombres, apellidos, dni, telefono, direccion, fecha_nacimiento, genero, pais) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt_usuarios = $this->conn->prepare($query_usuarios);
            $stmt_usuarios->execute([
                $usuario_id, $nombres, $apellidos, $dni, $telefono, 
                $direccion_final,
                $fecha_nacimiento,
                $genero,
                $pais
            ]);

            // Confirmar transacción
            $this->conn->commit();

            http_response_code(201);
            echo json_encode(array("message" => "Cuenta creada exitosamente"));

        } catch(Exception $e) {
            // Rollback en caso de error
            $this->conn->rollback();
            http_response_code(500);
            echo json_encode(array("error" => "Error en el servidor: " . $e->getMessage()));
        }
    }

    public function login($data) {
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST');
        header('Access-Control-Allow-Headers: Content-Type');

        try {
            $email = $data['email'];
            $password = $data['password'];

            // Buscar usuario
            $query = "SELECT * FROM " . $this->table_usuarios_login . " WHERE email = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$email]);

            if ($stmt->rowCount() == 1) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // Verificar si el usuario está activo
                if (isset($row['is_active']) && !$row['is_active']) {
                    http_response_code(403);
                    echo json_encode(array("error" => "Cuenta desactivada. Contacte al administrador."));
                    return;
                }
                
                if (password_verify($password, $row['password'])) {
                    // Obtener datos completos del usuario incluyendo el nombre, dni y teléfono
                    $query_usuario = "SELECT u.nombres, u.apellidos, u.dni, u.telefono FROM " . $this->table_usuarios . " u WHERE u.user_login_id = ?";
                    $stmt_usuario = $this->conn->prepare($query_usuario);
                    $stmt_usuario->execute([$row['id']]);
                    $usuario_data = $stmt_usuario->fetch(PDO::FETCH_ASSOC);
                    
                    $nombre_completo = '';
                    $dni = '';
                    $telefono = '';
                    if ($usuario_data) {
                        $nombre_completo = trim($usuario_data['nombres'] . ' ' . $usuario_data['apellidos']);
                        $dni = $usuario_data['dni'] ?? '';
                        $telefono = $usuario_data['telefono'] ?? '';
                    }
                    
                    // Generar token simple (en producción usar JWT)
                    $token = base64_encode($row['id'] . ':' . time());
                    
                    http_response_code(200);
                    echo json_encode(array(
                        "message" => "Login exitoso",
                        "token" => $token,
                        "usuario_id" => $row['id'],
                        "role" => $row['role'],
                        "nombre" => $nombre_completo,
                        "dni" => $dni,
                        "telefono" => $telefono,
                        "email" => $row['email']
                    ));
                } else {
                    http_response_code(401);
                    echo json_encode(array("error" => "Credenciales incorrectas"));
                }
            } else {
                http_response_code(401);
                echo json_encode(array("error" => "Usuario no encontrado"));
            }

        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(array("error" => "Error en el servidor: " . $e->getMessage()));
        }
    }

    public function obtenerPerfil($usuario_id) {
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');

        try {
            $query = "SELECT nombres as nombre, telefono, fecha_nacimiento, genero, direccion as direccion_principal, pais, email, role as rol
                      FROM usuarios u
                      LEFT JOIN usuarios_login ul ON u.user_login_id = ul.id
                      WHERE u.user_login_id = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$usuario_id]);

            if ($stmt->rowCount() == 1) {
                $perfil = $stmt->fetch(PDO::FETCH_ASSOC);
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'perfil' => $perfil
                ]);
            } else {
                http_response_code(404);
                echo json_encode(array("error" => "Perfil no encontrado"));
            }

        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(array("error" => "Error en el servidor: " . $e->getMessage()));
        }
    }
}
?>

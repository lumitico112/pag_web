<?php
require_once '../config/database.php';

class HistorialController {
    private $conn;
    private $table_historial = 'historial_compras';

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function guardarCompra($data) {
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');

        try {
            $usuario_id = $data['usuario_id'];
            $origen = $data['origen'];
            $destino = $data['destino'];
            $fecha_viaje = $data['fecha_viaje'];
            $hora_salida = $data['hora_salida'];
            $precio = $data['precio'];
            $asientos = json_encode($data['asientos']); // Convertir array a JSON
            $total = $data['total'];

            $query = "INSERT INTO " . $this->table_historial . " 
                (usuario_id, origen, destino, fecha_viaje, hora_salida, precio, asientos, total, fecha_compra) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute([
                $usuario_id, $origen, $destino, $fecha_viaje, 
                $hora_salida, $precio, $asientos, $total
            ]);

            http_response_code(201);
            echo json_encode(array(
                "message" => "Compra guardada exitosamente",
                "compra_id" => $this->conn->lastInsertId()
            ));

        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(array("error" => "Error en el servidor: " . $e->getMessage()));
        }
    }

    public function obtenerHistorial($usuario_id) {
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');

        try {
            $query = "SELECT * FROM " . $this->table_historial . " 
                WHERE usuario_id = ? ORDER BY fecha_compra DESC";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$usuario_id]);

            $historial = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Decodificar JSON de asientos para cada compra
            foreach ($historial as &$compra) {
                $compra['asientos'] = json_decode($compra['asientos'], true);
            }

            http_response_code(200);
            echo json_encode($historial);

        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(array("error" => "Error en el servidor: " . $e->getMessage()));
        }
    }
}
?>

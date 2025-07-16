<?php
require_once __DIR__ . '/config.php';

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        $this->host = DB_HOST;
        $this->db_name = DB_NAME;
        $this->username = DB_USER;
        $this->password = DB_PASS;
    }

    public function getConnection() {
        $this->conn = null;

        try {
            // Debug: verificar que las constantes estén definidas
            if (!defined('DB_PASS')) {
                throw new Exception("DB_PASS no está definida");
            }
            
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password,
                array(
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                )
            );
            
            // Establecer charset después de la conexión
            $this->conn->exec("SET NAMES utf8mb4");
        } catch(PDOException $exception) {
            error_log("Database connection error: " . $exception->getMessage());
            error_log("Host: " . $this->host . ", DB: " . $this->db_name . ", User: " . $this->username);
            // Mostrar el error real para depuración temporal
            throw new Exception("Error de conexión a la base de datos: " . $exception->getMessage());
        }

        return $this->conn;
    }

    public function getDatabase() {
        return $this->db_name;
    }
}
?>

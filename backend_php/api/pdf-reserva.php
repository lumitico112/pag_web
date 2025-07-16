<?php
// Generador de PDFs para reservas
require_once '../config/database.php';
require_once __DIR__ . '/../../vendor/autoload.php'; // Ruta correcta para Composer

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Función simple para generar PDF sin librerías externas
function generarPDFSimple($reserva) {
    $html = '<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Factura - ' . $reserva['codigo_reserva'] . '</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .factura-box { max-width: 700px; margin: auto; border: 1px solid #eee; padding: 30px; box-shadow: 0 0 10px #eee; }
            .logo { text-align: center; margin-bottom: 20px; }
            .datos-empresa { text-align: right, font-size: 14px; }
            .titulo { text-align: center; font-size: 28px; color: #1976d2; margin-bottom: 20px; }
            .info-cliente, .info-factura { margin-bottom: 20px; }
            .info-factura td { padding: 4px 8px; }
            .tabla-detalle { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .tabla-detalle th, .tabla-detalle td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .tabla-detalle th { background: #1976d2; color: #fff; }
            .total { text-align: right; font-size: 18px; font-weight: bold; color: #d32f2f; }
            .footer { text-align: center; font-size: 12px; color: #666; margin-top: 40px; }
        </style>
    </head>
    <body>
        <div class="factura-box">
            <div class="logo">
                <img src="http://localhost:8000/frontend/public/img/logo.png" alt="UTPTRAVEL" height="60">
            </div>
            <div class="datos-empresa">
                <strong>UTPTRAVEL S.A.C.</strong><br>
                RUC: 12345678901<br>
                Av. Principal 123, Lima, Perú<br>
                Tel: +51 919 543 387<br>
                Email: viajesseguro@utptravel.com
            </div>
            <div class="titulo">Factura Electrónica</div>
            <div class="info-factura">
                <table>
                    <tr><td><strong>Factura N°:</strong></td><td>' . $reserva['codigo_reserva'] . '</td></tr>
                    <tr><td><strong>Fecha de Emisión:</strong></td><td>' . date('d/m/Y H:i', strtotime($reserva['fecha_reserva'])) . '</td></tr>
                </table>
            </div>
            <div class="info-cliente">
                <strong>Cliente:</strong> ' . $reserva['pasajero_nombre'] . '<br>
                <strong>DNI:</strong> ' . $reserva['pasajero_dni'] . '
            </div>
            <table class="tabla-detalle">
                <tr>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Total</th>
                </tr>
                <tr>
                    <td>Pasaje: ' . $reserva['origen'] . ' → ' . $reserva['destino'] . ' (' . date('d/m/Y', strtotime($reserva['fecha_salida'])) . ')</td>
                    <td>1</td>
                    <td>S/. ' . number_format($reserva['precio_pagado'], 2) . '</td>
                    <td>S/. ' . number_format($reserva['precio_pagado'], 2) . '</td>
                </tr>
            </table>
            <div class="total">Total a Pagar: S/. ' . number_format($reserva['precio_pagado'], 2) . '</div>
            <div class="footer">
                <p>Gracias por su compra. Este documento es válido como comprobante electrónico.</p>
                <p>Contacto: +51 919 543 387 | viajesseguro@utptravel.com</p>
            </div>
        </div>
    </body>
    </html>';
    
    return $html;
}

try {
    if (!isset($_GET['reserva_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de reserva requerido']);
        exit;
    }
    
    $db = new Database();
    $conn = $db->getConnection();
    
    // Obtener datos de la reserva
    $stmt = $conn->prepare('
        SELECT r.*, ru.origen, ru.destino, ru.fecha_salida, ru.fecha_llegada
        FROM reservas r 
        JOIN rutas ru ON r.ruta_id = ru.id 
        WHERE r.id = ?
    ');
    $stmt->execute([$_GET['reserva_id']]);
    $reserva = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$reserva) {
        http_response_code(404);
        echo json_encode(['error' => 'Reserva no encontrada']);
        exit;
    }
    // Mapear nombres de campos para el PDF con los nuevos campos correctos
    $reserva['pasajero_nombre'] = $reserva['pasajero_nombre'] ?? '';
    $reserva['pasajero_dni'] = $reserva['dni_pasajero'] ?? '';
    $reserva['pasajero_telefono'] = $reserva['telefono_pasajero'] ?? '';
    $reserva['pasajero_email'] = $reserva['email_pasajero'] ?? '';
    $reserva['precio_pagado'] = $reserva['precio_total'] ?? 0;
    
    // Generar PDF simple (HTML que se puede imprimir)
    if (isset($_GET['format']) && $_GET['format'] === 'html') {
        header('Content-Type: text/html');
        echo generarPDFSimple($reserva);
    } else {
        // Generar respuesta JSON con datos para PDF
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'reserva' => $reserva,
            'pdf_url' => 'http://localhost:8000/backend_php/api/pdf-reserva.php?reserva_id=' . $_GET['reserva_id'] . '&format=html'
        ]);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error generando PDF: ' . $e->getMessage()]);
}
?>

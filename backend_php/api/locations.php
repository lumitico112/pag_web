<?php
require_once '../config/config.php';

// Manejar solicitudes OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    setCorsHeaders();
    exit(0);
}

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

class LocationsAPI {
    private $geodbApiKey = '1d176599f1msh47fbc6e4ae4c94ap1e3f33jsnedb5eb88d65d';
    private $geodbBaseUrl = 'https://wft-geo-db.p.rapidapi.com/v1/geo';
    
    public function __construct() {
        // Constructor
    }
    
    // Obtener regiones/estados de un país
    public function getRegions($countryCode = 'PE') {
        try {
            $url = $this->geodbBaseUrl . "/adminDivisions?countryIds=" . $countryCode . "&limit=100";
            
            $response = $this->makeGeoDBRequest($url);
            
            if ($response && isset($response['data'])) {
                $regions = array_map(function($region) {
                    return [
                        'id' => $region['id'],
                        'name' => $region['name'],
                        'countryCode' => $region['countryCode']
                    ];
                }, $response['data']);
                
                return [
                    'success' => true,
                    'regions' => $regions
                ];
            }
            
            return ['success' => false, 'error' => 'No se pudieron obtener las regiones'];
            
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    // Obtener ciudades de una región
    public function getCities($regionId = null, $countryCode = 'PE', $namePrefix = null) {
        try {
            $url = $this->geodbBaseUrl . "/cities?countryIds=" . $countryCode;
            
            if ($regionId) {
                $url .= "&adminDivisionIds=" . $regionId;
            }
            
            if ($namePrefix) {
                $url .= "&namePrefix=" . urlencode($namePrefix);
            }
            
            $url .= "&limit=100&sort=name";
            
            $response = $this->makeGeoDBRequest($url);
            
            if ($response && isset($response['data'])) {
                $cities = array_map(function($city) {
                    return [
                        'id' => $city['id'],
                        'name' => $city['name'],
                        'region' => $city['region'] ?? '',
                        'regionCode' => $city['regionCode'] ?? '',
                        'country' => $city['country'] ?? '',
                        'countryCode' => $city['countryCode'] ?? '',
                        'latitude' => $city['latitude'] ?? null,
                        'longitude' => $city['longitude'] ?? null,
                        'population' => $city['population'] ?? 0
                    ];
                }, $response['data']);
                
                return [
                    'success' => true,
                    'cities' => $cities
                ];
            }
            
            return ['success' => false, 'error' => 'No se pudieron obtener las ciudades'];
            
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    // Calcular distancia entre dos ciudades
    public function calculateDistance($city1Id, $city2Id) {
        try {
            // Obtener información de ambas ciudades
            $city1 = $this->getCityDetails($city1Id);
            $city2 = $this->getCityDetails($city2Id);
            
            if (!$city1 || !$city2) {
                return ['success' => false, 'error' => 'No se pudieron obtener los detalles de las ciudades'];
            }
            
            $distance = $this->haversineDistance(
                $city1['latitude'], $city1['longitude'],
                $city2['latitude'], $city2['longitude']
            );
            
            // Calcular precio basado en distancia (S/ 0.12 por km + base S/ 15)
            $precio = 15 + ($distance * 0.12);
            
            // Calcular duración aproximada (50 km/h promedio)
            $duracionHoras = $distance / 50;
            $horas = floor($duracionHoras);
            $minutos = round(($duracionHoras - $horas) * 60);
            
            return [
                'success' => true,
                'distance' => round($distance, 2),
                'price' => round($precio, 2),
                'duration' => sprintf('%02d:%02d', $horas, $minutos),
                'durationHours' => $duracionHoras
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    // Obtener detalles de una ciudad específica
    private function getCityDetails($cityId) {
        try {
            $url = $this->geodbBaseUrl . "/cities/" . $cityId;
            $response = $this->makeGeoDBRequest($url);
            
            if ($response && isset($response['data'])) {
                return $response['data'];
            }
            
            return null;
            
        } catch (Exception $e) {
            return null;
        }
    }
    
    // Hacer petición a GeoDB API
    private function makeGeoDBRequest($url) {
        $ch = curl_init();
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => false, // Deshabilitar verificación SSL en desarrollo
            CURLOPT_SSL_VERIFYHOST => false, // Deshabilitar verificación SSL en desarrollo
            CURLOPT_HTTPHEADER => [
                'X-RapidAPI-Key: ' . $this->geodbApiKey,
                'X-RapidAPI-Host: wft-geo-db.p.rapidapi.com'
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if (curl_errno($ch)) {
            throw new Exception('Error en cURL: ' . curl_error($ch));
        }
        
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new Exception('Error en API: HTTP ' . $httpCode);
        }
        
        return json_decode($response, true);
    }
    
    // Calcular distancia usando fórmula de Haversine
    private function haversineDistance($lat1, $lon1, $lat2, $lon2) {
        $earthRadius = 6371; // Radio de la Tierra en kilómetros
        
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        
        $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon/2) * sin($dLon/2);
        $c = 2 * atan2(sqrt($a), sqrt(1-$a));
        
        return $earthRadius * $c;
    }
}

// Procesar la petición
$locationsAPI = new LocationsAPI();

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['action'])) {
                switch ($_GET['action']) {
                    case 'regions':
                        $countryCode = $_GET['country'] ?? 'PE';
                        $testMode = isset($_GET['test']);
                        
                        if ($testMode) {
                            // Modo de prueba - respuesta rápida
                            echo json_encode([
                                'success' => true,
                                'test' => true,
                                'message' => 'API funcionando correctamente'
                            ]);
                        } else {
                            echo json_encode($locationsAPI->getRegions($countryCode));
                        }
                        break;
                        
                    case 'cities':
                        $regionId = $_GET['region'] ?? null;
                        $countryCode = $_GET['country'] ?? 'PE';
                        $namePrefix = $_GET['search'] ?? null;
                        echo json_encode($locationsAPI->getCities($regionId, $countryCode, $namePrefix));
                        break;
                        
                    case 'distance':
                        $city1 = $_GET['city1'] ?? null;
                        $city2 = $_GET['city2'] ?? null;
                        
                        if (!$city1 || !$city2) {
                            echo json_encode(['success' => false, 'error' => 'Se requieren ambas ciudades']);
                            break;
                        }
                        
                        echo json_encode($locationsAPI->calculateDistance($city1, $city2));
                        break;
                        
                    default:
                        echo json_encode(['success' => false, 'error' => 'Acción no válida']);
                        break;
                }
            } else {
                echo json_encode(['success' => false, 'error' => 'Se requiere especificar una acción']);
            }
            break;
            
        default:
            echo json_encode(['success' => false, 'error' => 'Método no permitido']);
            break;
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>

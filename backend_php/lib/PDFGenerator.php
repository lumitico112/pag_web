<?php
/**
 * Generador de PDF simple para reportes de UTPTRAVEL
 * Sin dependencias externas, usando solo PHP nativo
 */
class SimplePDFGenerator {
    private $content = '';
    private $pageWidth = 595.28; // A4 width in points
    private $pageHeight = 841.89; // A4 height in points
    private $margin = 50;
    private $currentY = 0;
    private $lineHeight = 14;
    private $fontSize = 12;
    
    public function __construct() {
        $this->initializePDF();
        $this->currentY = $this->pageHeight - $this->margin;
    }
    
    private function initializePDF() {
        $this->content = "%PDF-1.4\n";
        $this->content .= "1 0 obj\n";
        $this->content .= "<<\n";
        $this->content .= "/Type /Catalog\n";
        $this->content .= "/Pages 2 0 R\n";
        $this->content .= ">>\n";
        $this->content .= "endobj\n\n";
    }
    
    public function addTitle($title) {
        $this->fontSize = 18;
        $this->lineHeight = 22;
        $this->addText($title, true);
        $this->currentY -= 10; // Espacio extra después del título
        $this->fontSize = 12;
        $this->lineHeight = 14;
    }
    
    public function addSubtitle($subtitle) {
        $this->fontSize = 14;
        $this->lineHeight = 18;
        $this->addText($subtitle, true);
        $this->currentY -= 5;
        $this->fontSize = 12;
        $this->lineHeight = 14;
    }
    
    public function addText($text, $bold = false) {
        $lines = explode("\n", $text);
        foreach ($lines as $line) {
            if ($this->currentY < $this->margin + 20) {
                $this->addNewPage();
            }
            $this->addLine($line, $bold);
        }
    }
    
    private function addLine($text, $bold = false) {
        // Escapar caracteres especiales para PDF
        $text = $this->escapePDFString($text);
        
        $fontWeight = $bold ? 'Helvetica-Bold' : 'Helvetica';
        
        $this->content .= "BT\n";
        $this->content .= "/{$fontWeight} {$this->fontSize} Tf\n";
        $this->content .= "{$this->margin} {$this->currentY} Td\n";
        $this->content .= "({$text}) Tj\n";
        $this->content .= "ET\n";
        
        $this->currentY -= $this->lineHeight;
    }
    
    public function addSeparator() {
        $this->currentY -= 5;
        $this->content .= "{$this->margin} {$this->currentY} m\n";
        $this->content .= ($this->pageWidth - $this->margin) . " {$this->currentY} l\n";
        $this->content .= "S\n";
        $this->currentY -= 10;
    }
    
    public function addSpace($points = 10) {
        $this->currentY -= $points;
    }
    
    private function addNewPage() {
        $this->currentY = $this->pageHeight - $this->margin;
    }
    
    private function escapePDFString($str) {
        // Convertir caracteres especiales para PDF
        $str = str_replace(['(', ')', '\\'], ['\\(', '\\)', '\\\\'], $str);
        // Convertir caracteres UTF-8 comunes del español
        $str = str_replace(['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', 'Á', 'É', 'Í', 'Ó', 'Ú', 'Ñ', 'Ü'], 
                          ['a', 'e', 'i', 'o', 'u', 'n', 'u', 'A', 'E', 'I', 'O', 'U', 'N', 'U'], $str);
        return $str;
    }
    
    public function generate() {
        // Crear el objeto de página
        $pageContent = "3 0 obj\n";
        $pageContent .= "<<\n";
        $pageContent .= "/Length " . strlen($this->content) . "\n";
        $pageContent .= ">>\n";
        $pageContent .= "stream\n";
        $pageContent .= $this->content;
        $pageContent .= "\nendstream\n";
        $pageContent .= "endobj\n\n";
        
        // Crear la página
        $page = "2 0 obj\n";
        $page .= "<<\n";
        $page .= "/Type /Pages\n";
        $page .= "/Kids [4 0 R]\n";
        $page .= "/Count 1\n";
        $page .= ">>\n";
        $page .= "endobj\n\n";
        
        $pageObj = "4 0 obj\n";
        $pageObj .= "<<\n";
        $pageObj .= "/Type /Page\n";
        $pageObj .= "/Parent 2 0 R\n";
        $pageObj .= "/MediaBox [0 0 {$this->pageWidth} {$this->pageHeight}]\n";
        $pageObj .= "/Contents 3 0 R\n";
        $pageObj .= "/Resources <<\n";
        $pageObj .= "/Font <<\n";
        $pageObj .= "/Helvetica 5 0 R\n";
        $pageObj .= "/Helvetica-Bold 6 0 R\n";
        $pageObj .= ">>\n";
        $pageObj .= ">>\n";
        $pageObj .= ">>\n";
        $pageObj .= "endobj\n\n";
        
        // Fuentes
        $helvetica = "5 0 obj\n";
        $helvetica .= "<<\n";
        $helvetica .= "/Type /Font\n";
        $helvetica .= "/Subtype /Type1\n";
        $helvetica .= "/BaseFont /Helvetica\n";
        $helvetica .= ">>\n";
        $helvetica .= "endobj\n\n";
        
        $helveticaBold = "6 0 obj\n";
        $helveticaBold .= "<<\n";
        $helveticaBold .= "/Type /Font\n";
        $helveticaBold .= "/Subtype /Type1\n";
        $helveticaBold .= "/BaseFont /Helvetica-Bold\n";
        $helveticaBold .= ">>\n";
        $helveticaBold .= "endobj\n\n";
        
        // Tabla xref
        $xref = "xref\n";
        $xref .= "0 7\n";
        $xref .= "0000000000 65535 f \n";
        $xref .= "0000000010 00000 n \n";
        $xref .= "0000000079 00000 n \n";
        $xref .= "0000000173 00000 n \n";
        $xref .= "0000000301 00000 n \n";
        $xref .= "0000000380 00000 n \n";
        $xref .= "0000000500 00000 n \n";
        
        // Trailer
        $trailer = "trailer\n";
        $trailer .= "<<\n";
        $trailer .= "/Size 7\n";
        $trailer .= "/Root 1 0 R\n";
        $trailer .= ">>\n";
        $trailer .= "startxref\n";
        $trailer .= "1000\n";
        $trailer .= "%%EOF\n";
        
        return $this->content . $page . $pageContent . $pageObj . $helvetica . $helveticaBold . $xref . $trailer;
    }
}

/**
 * Generador específico para reportes de rutas de UTPTRAVEL
 */
class ReporteRutaPDF {
    private $pdf;
    private $rutaData;
    
    public function __construct($rutaData) {
        $this->pdf = new SimplePDFGenerator();
        $this->rutaData = $rutaData;
    }
    
    public function generar() {
        // Encabezado del reporte
        $this->pdf->addTitle("REPORTE DE RUTA CONCLUIDA");
        $this->pdf->addText("Sistema UTPTRAVEL - Panel de Administracion");
        $this->pdf->addText("Generado: " . date('d/m/Y H:i:s'));
        $this->pdf->addSeparator();
        
        // Información básica
        $this->pdf->addSubtitle("INFORMACION BASICA");
        $this->pdf->addText("ID Ruta: " . $this->rutaData['id']);
        $this->pdf->addText("Ruta Original ID: " . $this->rutaData['ruta_id_original']);
        $this->pdf->addText("Origen: " . $this->rutaData['origen']);
        $this->pdf->addText("Destino: " . $this->rutaData['destino']);
        $this->pdf->addSpace();
        
        // Información del viaje
        $this->pdf->addSubtitle("INFORMACION DEL VIAJE");
        $this->pdf->addText("Fecha de Salida: " . ($this->rutaData['fecha_salida'] ? date('d/m/Y H:i', strtotime($this->rutaData['fecha_salida'])) : 'No especificada'));
        $this->pdf->addText("Fecha de Llegada: " . ($this->rutaData['fecha_llegada'] ? date('d/m/Y H:i', strtotime($this->rutaData['fecha_llegada'])) : 'No especificada'));
        $this->pdf->addText("Duracion: " . ($this->rutaData['duracion'] ?: 'No especificada'));
        $this->pdf->addText("Distancia: " . ($this->rutaData['distancia_km'] ? $this->rutaData['distancia_km'] . ' km' : 'No especificada'));
        $this->pdf->addText("Precio Base: S/. " . number_format($this->rutaData['precio'], 2));
        $this->pdf->addSpace();
        
        // Capacidad y ocupación
        $this->pdf->addSubtitle("CAPACIDAD Y OCUPACION");
        $this->pdf->addText("Capacidad Total: " . $this->rutaData['capacidad_pasajeros'] . " pasajeros");
        $this->pdf->addText("Reservas Realizadas: " . ($this->rutaData['total_reservas'] ?: 0));
        $ocupacion = $this->rutaData['capacidad_pasajeros'] > 0 ? round(($this->rutaData['total_reservas'] ?: 0) / $this->rutaData['capacidad_pasajeros'] * 100, 1) : 0;
        $this->pdf->addText("Ocupacion: " . $ocupacion . "%");
        $this->pdf->addSpace();
        
        // Información financiera
        $this->pdf->addSubtitle("INFORMACION FINANCIERA");
        $ingresosPotenciales = $this->rutaData['precio'] * $this->rutaData['capacidad_pasajeros'];
        $this->pdf->addText("Ingresos Potenciales: S/. " . number_format($ingresosPotenciales, 2));
        $this->pdf->addText("Ingresos Reales: S/. " . number_format($this->rutaData['ingresos_reales'] ?: 0, 2));
        $this->pdf->addText("Precio Promedio por Reserva: S/. " . number_format($this->rutaData['precio_promedio'] ?: 0, 2));
        $eficiencia = $ingresosPotenciales > 0 ? round(($this->rutaData['ingresos_reales'] ?: 0) / $ingresosPotenciales * 100, 1) : 0;
        $this->pdf->addText("Eficiencia de Ingresos: " . $eficiencia . "%");
        $this->pdf->addSpace();
        
        // Fechas importantes
        $this->pdf->addSubtitle("FECHAS IMPORTANTES");
        $this->pdf->addText("Fecha de Conclusion: " . date('d/m/Y H:i', strtotime($this->rutaData['fecha_conclusion'])));
        $this->pdf->addText("Fecha de Registro: " . date('d/m/Y H:i', strtotime($this->rutaData['created_at'])));
        $this->pdf->addSpace();
        
        // Pasajeros si existen
        if (!empty($this->rutaData['pasajeros_nombres'])) {
            $this->pdf->addSubtitle("PASAJEROS REGISTRADOS");
            $this->pdf->addText($this->rutaData['pasajeros_nombres']);
            $this->pdf->addSpace();
        }
        
        // Estado final
        $this->pdf->addSubtitle("ESTADO FINAL");
        $this->pdf->addText("Estado: " . strtoupper($this->rutaData['estado']));
        $this->pdf->addText("Sistema: UTPTRAVEL");
        
        return $this->pdf->generate();
    }
}
?>

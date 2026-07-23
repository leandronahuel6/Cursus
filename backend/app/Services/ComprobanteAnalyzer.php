<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

/**
 * Extrae monto/fecha/medio de pago de un comprobante usando Gemini y clasifica
 * si el archivo es siquiera un comprobante de pago real. Solo hace lectura del
 * documento — la comparación contra el monto exigible la calcula el controller
 * en base a la fecha que la propia IA extrajo del comprobante (no la que haya
 * tipeado el alumno), porque la fecha real de pago es la que figura en el
 * documento, no la fecha en que se sube el archivo al sitio.
 */
class ComprobanteAnalyzer
{
    private const MIME_POR_EXTENSION = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'pdf' => 'application/pdf',
    ];

    public static function analizar(UploadedFile $file, string $extension): ?array
    {
        $apiKey = config('services.gemini.key');
        $mimeType = self::MIME_POR_EXTENSION[$extension] ?? null;

        if (!$apiKey || !$mimeType) {
            return null;
        }

        $data = base64_encode(file_get_contents($file->getRealPath()));

        $prompt = <<<'PROMPT'
Analiza este archivo. Primero determiná si ES un comprobante de pago real: una transferencia, depósito, pago bancario o recibo de tesorería. Si es cualquier otra cosa (una foto sin relación, un documento distinto, un gráfico, un cronograma, etc.), marcá "es_comprobante_valido" en false.

Si sí es un comprobante de pago, extraé los datos visibles: el monto pagado, la fecha en que se realizó el pago (tal como figura en el comprobante, no la fecha de hoy), el medio de pago, y el número de operación/CBU/alias si aparece.

Devolvé estrictamente JSON con este esquema:
{
  "es_comprobante_valido": true o false,
  "monto": <número o null>,
  "fecha": "YYYY-MM-DD o null",
  "medio_pago": "string o null",
  "referencia": "string o null",
  "observaciones": "breve nota en español si hay algo llamativo o dudoso, o null"
}
No inventes datos que no estén visibles en el archivo; usá null cuando no puedas leerlos con certeza.
PROMPT;

        try {
            $response = Http::withHeaders(['Content-Type' => 'application/json'])
                ->timeout(20)
                ->post('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key='.$apiKey, [
                    'contents' => [[
                        'parts' => [
                            ['inlineData' => ['mimeType' => $mimeType, 'data' => $data]],
                            ['text' => $prompt],
                        ],
                    ]],
                    'generationConfig' => ['responseMimeType' => 'application/json'],
                ]);

            if (!$response->successful()) {
                return null;
            }

            $rawText = $response->json()['candidates'][0]['content']['parts'][0]['text'] ?? null;
            if (!$rawText) {
                return null;
            }

            $parsed = json_decode(trim($rawText), true);

            return json_last_error() === JSON_ERROR_NONE ? $parsed : null;
        } catch (\Exception $e) {
            report($e);

            return null;
        }
    }

    // Compara el monto que la IA leyó del comprobante contra el monto exigible
    // calculado por el sistema, con una pequeña tolerancia de redondeo.
    // Se calcula acá (no se le pide a Gemini que haga la cuenta) para no
    // depender de que la IA razone bien la aritmética.
    public static function compararMonto(?float $montoDeclarado, ?float $montoExigible): ?bool
    {
        if ($montoDeclarado === null || $montoExigible === null) {
            return null;
        }

        return abs($montoDeclarado - $montoExigible) <= 1.0;
    }
}

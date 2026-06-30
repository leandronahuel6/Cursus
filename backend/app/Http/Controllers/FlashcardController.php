<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\FlashcardDeck;
use App\Models\Flashcard;

class FlashcardController extends Controller
{
    /**
     * List all flashcard decks for the authenticated user.
     */
    public function indexDecks(Request $request)
    {
        $userId = $request->user()->id;
        $decksCount = FlashcardDeck::where('usuario_id', $userId)->count();

        if ($decksCount === 0) {
            // Crear mazo de demostración
            $demoDeck = FlashcardDeck::create([
                'usuario_id' => $userId,
                'nombre' => '💡 Mazo de Demostración',
                'descripcion' => 'Aprende a usar el módulo de flashcards y memoriza con el carrusel 3D.',
                'color' => 'indigo',
            ]);

            // Agregar tarjetas demostrativas
            $demoDeck->flashcards()->create([
                'pregunta' => '¿Cómo funciona el efecto 3D de estas tarjetas?',
                'respuesta' => 'Al hacer clic en ellas, rotan 180 grados sobre su eje Y mediante transformaciones de CSS 3D.',
            ]);
            $demoDeck->flashcards()->create([
                'pregunta' => '¿Cuáles son los atajos de teclado para estudiar?',
                'respuesta' => 'Usa [Espacio] para voltear la tarjeta, [Flecha Izquierda] o [1] para marcar "No lo sé", y [Flecha Derecha] o [2] para "Lo sé".',
            ]);
            $demoDeck->flashcards()->create([
                'pregunta' => '¿El progreso se guarda en el servidor?',
                'respuesta' => '¡Sí! Cada vez que valoras una tarjeta, el resultado se envía a la API en segundo plano y se guarda en la base de datos local.',
            ]);
        }

        $decks = FlashcardDeck::where('usuario_id', $userId)
            ->withCount('flashcards')
            ->get()
            ->map(function ($deck) {
                $totalCorrect = $deck->flashcards()->sum('correctas');
                $totalIncorrect = $deck->flashcards()->sum('incorrectas');
                $totalAttempts = $totalCorrect + $totalIncorrect;
                $accuracy = $totalAttempts > 0 ? round(($totalCorrect / $totalAttempts) * 100) : null;
                $lastReviewed = $deck->flashcards()->whereNotNull('ultimo_resultado')->max('updated_at');

                return [
                    'id' => $deck->id,
                    'nombre' => $deck->nombre,
                    'descripcion' => $deck->descripcion,
                    'color' => $deck->color,
                    'categoria' => $deck->categoria,
                    'cards_count' => $deck->flashcards_count,
                    'correctas_count' => (int) $totalCorrect,
                    'incorrectas_count' => (int) $totalIncorrect,
                    'porcentaje_acierto' => $accuracy,
                    'ultimo_repaso' => $lastReviewed ? \Carbon\Carbon::parse($lastReviewed)->format('d/m/Y H:i') : null,
                ];
            });

        return response()->json($decks);
    }

    /**
     * Create a new flashcard deck.
     */
    public function storeDeck(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:50',
            'categoria' => 'nullable|string|max:100',
        ]);

        $validated['usuario_id'] = $request->user()->id;
        $deck = FlashcardDeck::create($validated);

        return response()->json($deck, 201);
    }

    /**
     * Update a flashcard deck.
     */
    public function updateDeck(Request $request, FlashcardDeck $deck)
    {
        if ($deck->usuario_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:50',
            'categoria' => 'nullable|string|max:100',
        ]);

        $deck->update($validated);

        return response()->json($deck);
    }

    /**
     * Delete a flashcard deck.
     */
    public function destroyDeck(FlashcardDeck $deck)
    {
        if ($deck->usuario_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $deck->delete();

        return response()->json(['message' => 'Mazo eliminado con éxito']);
    }

    /**
     * List all cards inside a specific deck.
     */
    public function indexCards(FlashcardDeck $deck)
    {
        if ($deck->usuario_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($deck->flashcards);
    }

    /**
     * Add a card to a deck.
     */
    public function storeCard(Request $request, FlashcardDeck $deck)
    {
        if ($deck->usuario_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'pregunta' => 'required|string',
            'respuesta' => 'required|string',
            'distractor_1' => 'nullable|string|max:255',
            'distractor_2' => 'nullable|string|max:255',
            'distractor_3' => 'nullable|string|max:255',
        ]);

        $card = $deck->flashcards()->create($validated);

        return response()->json($card, 201);
    }

    /**
     * Update a specific card.
     */
    public function updateCard(Request $request, Flashcard $card)
    {
        if ($card->deck->usuario_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'pregunta' => 'required|string',
            'respuesta' => 'required|string',
            'distractor_1' => 'nullable|string|max:255',
            'distractor_2' => 'nullable|string|max:255',
            'distractor_3' => 'nullable|string|max:255',
        ]);

        $card->update($validated);

        return response()->json($card);
    }

    /**
     * Delete a specific card.
     */
    public function destroyCard(Flashcard $card)
    {
        if ($card->deck->usuario_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $card->delete();

        return response()->json(['message' => 'Tarjeta eliminada con éxito']);
    }

    /**
     * Record the study outcome of a flashcard (correct/incorrect).
     */
    public function recordResult(Request $request, Flashcard $card)
    {
        if ($card->deck->usuario_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'resultado' => 'required|in:correcto,incorrecto',
        ]);

        if ($request->resultado === 'correcto') {
            $card->increment('correctas');
            $card->ultimo_resultado = 'correcto';
            
            // Leitner System: Aumenta nivel de caja hasta máximo 5
            $currentBox = $card->caja ?? 1;
            $card->caja = min(5, $currentBox + 1);
        } else {
            $card->increment('incorrectas');
            $card->ultimo_resultado = 'incorrecto';
            
            // Leitner System: Resetea a caja 1
            $card->caja = 1;
        }

        $card->save();

        return response()->json($card);
    }

    /**
     * Import a complete deck with cards from a JSON payload.
     */
    public function importDeck(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:50',
            'categoria' => 'nullable|string|max:100',
            'cards' => 'required|array',
            'cards.*.pregunta' => 'required|string',
            'cards.*.respuesta' => 'required|string',
            'cards.*.distractor_1' => 'nullable|string',
            'cards.*.distractor_2' => 'nullable|string',
            'cards.*.distractor_3' => 'nullable|string',
        ]);

        $userId = $request->user()->id;

        $deck = \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $userId) {
            $deck = FlashcardDeck::create([
                'usuario_id' => $userId,
                'nombre' => $validated['nombre'],
                'descripcion' => $validated['descripcion'] ?? null,
                'color' => $validated['color'] ?? 'indigo',
                'categoria' => $validated['categoria'] ?? null,
            ]);

            foreach ($validated['cards'] as $card) {
                $deck->flashcards()->create([
                    'pregunta' => $card['pregunta'],
                    'respuesta' => $card['respuesta'],
                    'distractor_1' => $card['distractor_1'] ?? null,
                    'distractor_2' => $card['distractor_2'] ?? null,
                    'distractor_3' => $card['distractor_3'] ?? null,
                    'caja' => 1,
                ]);
            }

            return $deck;
        });

        return response()->json($deck, 201);
    }

    /**
     * Generate a new deck using AI (Gemini) from a document or image file.
     */
    public function generateFromIA(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:15360', // Max 15MB
            'cantidad' => 'nullable|integer|min:5|max:25',
            'categoria' => 'nullable|string|max:255',
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $allowedExtensions = ['pdf', 'docx', 'pptx', 'txt', 'md', 'jpg', 'jpeg', 'png'];
        if (!in_array($extension, $allowedExtensions)) {
            return response()->json(['message' => 'El archivo debe ser de tipo: pdf, docx, pptx, txt, md, jpg, jpeg, png.'], 422);
        }

        $cantidad = (int) $request->input('cantidad', 10);
        $cantidad = max(5, min(25, $cantidad));

        $userCategory = $request->input('categoria', '__AUTO__');

        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
            return response()->json(['message' => 'La clave API de Gemini (GEMINI_API_KEY) no está configurada en el archivo .env.'], 500);
        }

        $isImage = in_array($extension, ['jpg', 'jpeg', 'png']);
        $parts = [];

        if ($isImage) {
            $mimeType = $extension === 'png' ? 'image/png' : 'image/jpeg';
            $fileData = base64_encode(file_get_contents($file->getRealPath()));
            $parts = [
                [
                    'inlineData' => [
                        'mimeType' => $mimeType,
                        'data' => $fileData
                    ]
                ],
                [
                    'text' => "Analiza la siguiente imagen de apuntes o apuntes académicos y genera un mazo de estudio de flashcards con preguntas y respuestas significativas en español. El mazo debe tener exactamente {$cantidad} flashcards.
Devuelve el resultado estrictamente en formato JSON utilizando el siguiente esquema:
{
  \"nombre\": \"Título del tema (máximo 40 caracteres)\",
  \"descripcion\": \"Breve descripción de lo que trata (máximo 150 caracteres)\",
  \"color\": \"Elegir uno de estos colores de forma aleatoria según el tema: indigo, green, pink, amber, purple, cyan\",
  \"categoria\": \"Deduce e indica la materia o categoría principal del texto (ej: Programación, Matemáticas, Legislación, Medicina, etc., máximo 30 caracteres)\",
  \"cards\": [
    {
      \"pregunta\": \"Pregunta clara y concisa (ej: ¿Qué es X? o ¿Cuál es la función de Y?)\",
      \"respuesta\": \"Respuesta explicativa corta (máximo 200 caracteres)\",
      \"distractores\": [
        \"Opción incorrecta falsa pero muy creíble 1 (máximo 150 caracteres)\",
        \"Opción incorrecta falsa pero muy creíble 2 (máximo 150 caracteres)\",
        \"Opción incorrecta falsa pero muy creíble 3 (máximo 150 caracteres)\"
      ]
    }
  ]
}"
                ]
            ];
        } else {
            $fileName = time() . '_' . $file->getClientOriginalName();
            $tempPath = $file->storeAs('temp_ia', $fileName);
            $fullPath = \Illuminate\Support\Facades\Storage::path($tempPath);

            $scriptPath = storage_path('app/extract_text.py');
            $escapedPath = escapeshellarg($fullPath);
            $escapedScript = escapeshellarg($scriptPath);

            // Ejecutar extracción mediante Python (capturando errores con 2>&1)
            $command = "py $escapedScript $escapedPath 2>&1";
            $output = shell_exec($command);

            // Fallback a 'python' si 'py' no está en la ruta del servidor de Laragon
            if (empty($output) || str_contains(strtolower($output), 'no se reconoce') || str_contains(strtolower($output), 'not recognized')) {
                $command = "python $escapedScript $escapedPath 2>&1";
                $output = shell_exec($command);
            }

            // Limpiar el archivo temporal
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }

            if (empty($output)) {
                return response()->json(['message' => 'No se pudo extraer texto del archivo (salida de comando vacía o sin texto legible).'], 400);
            }

            // Si la salida contiene un mensaje de error del sistema operativo o de ejecución de Python
            if (str_contains(strtolower($output), 'no se reconoce') || str_contains(strtolower($output), 'not recognized') || str_contains(strtolower($output), 'traceback') || str_contains(strtolower($output), 'error:')) {
                return response()->json(['message' => 'Error en script de extracción: ' . trim($output)], 500);
            }

            // Limitar a los primeros 45,000 caracteres para evitar exceder límites razonables
            $text = mb_substr($output, 0, 45000, 'UTF-8');
            $parts = [
                [
                    'text' => "Analiza el siguiente texto académico y genera un mazo de estudio de flashcards con preguntas y respuestas significativas en español. El mazo debe tener exactamente {$cantidad} flashcards.
Devuelve el resultado estrictamente en formato JSON utilizando el siguiente esquema:
{
  \"nombre\": \"Título del tema (máximo 40 caracteres)\",
  \"descripcion\": \"Breve descripción de lo que trata (máximo 150 caracteres)\",
  \"color\": \"Elegir uno de estos colores de forma aleatoria según el tema: indigo, green, pink, amber, purple, cyan\",
  \"categoria\": \"Deduce e indica la materia o categoría principal del texto (ej: Programación, Matemáticas, Legislación, Medicina, etc., máximo 30 caracteres)\",
  \"cards\": [
    {
      \"pregunta\": \"Pregunta clara y concisa (ej: ¿Qué es X? o ¿Cuál es la función de Y?)\",
      \"respuesta\": \"Respuesta explicativa corta (máximo 200 caracteres)\",
      \"distractores\": [
        \"Opción incorrecta falsa pero muy creíble 1 (máximo 150 caracteres)\",
        \"Opción incorrecta falsa pero muy creíble 2 (máximo 150 caracteres)\",
        \"Opción incorrecta falsa pero muy creíble 3 (máximo 150 caracteres)\"
      ]
    }
  ]
}

Texto académico:
" . $text
                ]
            ];
        }

        // Consultar API de Gemini
        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey, [
                'contents' => [
                    [
                        'parts' => $parts
                    ]
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json'
                ]
            ]);

            if (!$response->successful()) {
                $errorMsg = $response->json()['error']['message'] ?? 'Error desconocido al consultar la API de Gemini.';
                return response()->json(['message' => 'Error de Gemini: ' . $errorMsg], 502);
            }

            $result = $response->json();
            $rawText = $result['candidates'][0]['content']['parts'][0]['text'] ?? null;

            if (!$rawText) {
                return response()->json(['message' => 'La Inteligencia Artificial no devolvió un formato válido.'], 502);
            }

            $deckData = json_decode(trim($rawText), true);
            if (json_last_error() !== JSON_ERROR_NONE || !isset($deckData['nombre']) || !isset($deckData['cards'])) {
                return response()->json(['message' => 'Error al decodificar la estructura JSON generada por la IA.'], 502);
            }

            $userId = $request->user()->id;

            $deck = \Illuminate\Support\Facades\DB::transaction(function () use ($deckData, $userId, $userCategory) {
                $finalCategory = ($userCategory === '__AUTO__') 
                    ? ($deckData['categoria'] ?? 'General') 
                    : $userCategory;

                $deck = FlashcardDeck::create([
                    'usuario_id' => $userId,
                    'nombre' => $deckData['nombre'],
                    'descripcion' => $deckData['descripcion'] ?? 'Generado automáticamente por IA.',
                    'color' => $deckData['color'] ?? 'indigo',
                    'categoria' => $finalCategory,
                ]);

                foreach ($deckData['cards'] as $card) {
                    $distractores = $card['distractores'] ?? [];
                    $deck->flashcards()->create([
                        'pregunta' => $card['pregunta'],
                        'respuesta' => $card['respuesta'],
                        'distractor_1' => $distractores[0] ?? null,
                        'distractor_2' => $distractores[1] ?? null,
                        'distractor_3' => $distractores[2] ?? null,
                        'caja' => 1,
                    ]);
                }

                return $deck;
            });

            return response()->json([
                'id' => $deck->id,
                'nombre' => $deck->nombre,
                'descripcion' => $deck->descripcion,
                'color' => $deck->color,
                'categoria' => $deck->categoria,
                'cards_count' => count($deckData['cards']),
                'porcentaje_acierto' => null,
                'ultimo_repaso' => null
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Ocurrió un error inesperado al procesar la solicitud: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generate 3 incorrect distractors using Gemini for a manual card based on question & answer.
     */
    public function generateDistractors(Request $request)
    {
        $request->validate([
            'pregunta' => 'required|string',
            'respuesta' => 'required|string',
            'categoria' => 'nullable|string',
        ]);

        $pregunta = $request->input('pregunta');
        $respuesta = $request->input('respuesta');
        $categoria = $request->input('categoria', 'General');

        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
            return response()->json(['message' => 'La clave API de Gemini no está configurada.'], 500);
        }

        $prompt = "Actúa como un profesor experto y ayúdame a generar 3 opciones incorrectas (distractores) realistas y creíbles pero falsas para una pregunta de opción múltiple.
La pregunta es: \"{$pregunta}\"
La respuesta correcta es: \"{$respuesta}\"
El tema o categoría de estudio general es: \"{$categoria}\"

Devuelve los datos estrictamente en formato JSON utilizando el siguiente esquema:
{
  \"distractor_1\": \"Opción incorrecta 1 (creíble y en español, máximo 150 caracteres)\",
  \"distractor_2\": \"Opción incorrecta 2 (creíble y en español, máximo 150 caracteres)\",
  \"distractor_3\": \"Opción incorrecta 3 (creíble y en español, máximo 150 caracteres)\"
}";

        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt]
                        ]
                    ]
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json'
                ]
            ]);

            if (!$response->successful()) {
                $errorMsg = $response->json()['error']['message'] ?? 'Error al conectar con la API de Gemini.';
                return response()->json(['message' => 'Error de Gemini: ' . $errorMsg], 502);
            }

            $result = $response->json();
            $rawText = $result['candidates'][0]['content']['parts'][0]['text'] ?? null;

            if (!$rawText) {
                return response()->json(['message' => 'La IA no devolvió un formato válido.'], 502);
            }

            $distractorsData = json_decode(trim($rawText), true);
            if (json_last_error() !== JSON_ERROR_NONE || !isset($distractorsData['distractor_1'])) {
                return response()->json(['message' => 'Error al decodificar la estructura generada por la IA.'], 502);
            }

            return response()->json([
                'distractor_1' => $distractorsData['distractor_1'] ?? null,
                'distractor_2' => $distractorsData['distractor_2'] ?? null,
                'distractor_3' => $distractorsData['distractor_3'] ?? null,
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Error: ' . $e->getMessage()], 500);
        }
    }
}

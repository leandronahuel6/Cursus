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
            'cards' => 'required|array',
            'cards.*.pregunta' => 'required|string',
            'cards.*.respuesta' => 'required|string',
        ]);

        $userId = $request->user()->id;

        $deck = \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $userId) {
            $deck = FlashcardDeck::create([
                'usuario_id' => $userId,
                'nombre' => $validated['nombre'],
                'descripcion' => $validated['descripcion'] ?? null,
                'color' => $validated['color'] ?? 'indigo',
            ]);

            foreach ($validated['cards'] as $card) {
                $deck->flashcards()->create([
                    'pregunta' => $card['pregunta'],
                    'respuesta' => $card['respuesta'],
                    'caja' => 1,
                ]);
            }

            return $deck;
        });

        return response()->json($deck, 201);
    }
}

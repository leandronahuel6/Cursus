<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MateriaController;
use App\Http\Controllers\NotaController;
use App\Http\Controllers\CuotaController;
use App\Http\Controllers\HorarioController;
use App\Http\Controllers\SesionPomodoroController;
use App\Http\Controllers\TareaController;
use App\Http\Controllers\MarcadorController;
use App\Http\Controllers\AlertaController;
use App\Http\Controllers\RecordatorioCuotaController;
use App\Http\Controllers\PagoCuotaController;
use App\Http\Controllers\FlashcardController;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
Route::get('/materias', [MateriaController::class, 'index']);
Route::get('/cuotas', [CuotaController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/change-password', [AuthController::class, 'changePassword']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/notas', [NotaController::class, 'index']);
    Route::post('/notas', [NotaController::class, 'store']);
    Route::put('/notas/{nota}', [NotaController::class, 'update']);
    Route::delete('/notas/{nota}', [NotaController::class, 'destroy']);

    Route::post('/cuotas', [CuotaController::class, 'store']);

    Route::get('/mis-materias', [MateriaController::class, 'misMaterias']);
    Route::put('/materias/{materia}/estado', [MateriaController::class, 'actualizarEstado']);

    Route::get('/horarios', [HorarioController::class, 'index']);
    Route::post('/horarios/sync', [HorarioController::class, 'sync']);

    Route::post('/pomodoro/sesiones', [SesionPomodoroController::class, 'store']);
    Route::get('/pomodoro/resumen', [SesionPomodoroController::class, 'resumenUsuario']);
    Route::get('/materias/{materia}/pomodoro-resumen', [SesionPomodoroController::class, 'resumenMateria']);

    Route::get('/tareas/proximas', [TareaController::class, 'proximas']);
    Route::get('/tareas/pendientes-count', [TareaController::class, 'pendientesCount']);
    Route::get('/tareas', [TareaController::class, 'index']);
    Route::post('/tareas', [TareaController::class, 'store']);
    Route::put('/tareas/{tarea}', [TareaController::class, 'update']);
    Route::delete('/tareas/{tarea}', [TareaController::class, 'destroy']);

    Route::get('/marcadores', [MarcadorController::class, 'index']);
    Route::post('/marcadores', [MarcadorController::class, 'store']);
    Route::put('/marcadores/{marcador}', [MarcadorController::class, 'update']);
    Route::delete('/marcadores/{marcador}', [MarcadorController::class, 'destroy']);

    Route::get('/alertas', [AlertaController::class, 'index']);
    Route::post('/alertas', [AlertaController::class, 'store']);
    Route::put('/alertas/{alerta}', [AlertaController::class, 'update']);
    Route::delete('/alertas/{alerta}', [AlertaController::class, 'destroy']);

    Route::get('/recordatorio-cuota', [RecordatorioCuotaController::class, 'show']);
    Route::put('/recordatorio-cuota', [RecordatorioCuotaController::class, 'update']);

    Route::get('/pagos-cuota/estado', [PagoCuotaController::class, 'estado']);
    Route::post('/pagos-cuota', [PagoCuotaController::class, 'store']);

    // Rutas de Flashcards
    Route::get('/flashcards/decks', [FlashcardController::class, 'indexDecks']);
    Route::post('/flashcards/decks', [FlashcardController::class, 'storeDeck']);
    Route::post('/flashcards/decks/import', [FlashcardController::class, 'importDeck']);
    Route::put('/flashcards/decks/{deck}', [FlashcardController::class, 'updateDeck']);
    Route::delete('/flashcards/decks/{deck}', [FlashcardController::class, 'destroyDeck']);
    Route::get('/flashcards/decks/{deck}/cards', [FlashcardController::class, 'indexCards']);
    Route::post('/flashcards/decks/{deck}/cards', [FlashcardController::class, 'storeCard']);
    Route::put('/flashcards/cards/{card}', [FlashcardController::class, 'updateCard']);
    Route::delete('/flashcards/cards/{card}', [FlashcardController::class, 'destroyCard']);
    Route::post('/flashcards/cards/{card}/resultado', [FlashcardController::class, 'recordResult']);
});
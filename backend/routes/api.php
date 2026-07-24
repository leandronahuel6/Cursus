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
use App\Http\Controllers\PagoCuotaController;
use App\Http\Controllers\FlashcardController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ConfigPomodoroController;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
Route::post('/contact', [AuthController::class, 'contact'])->middleware('throttle:10,1');
Route::get('/materias', [MateriaController::class, 'index']);
Route::get('/cuotas', [CuotaController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/profile/avatar', [AuthController::class, 'updateAvatar']);
    Route::delete('/profile/avatar', [AuthController::class, 'deleteAvatar']);
    Route::post('/profile/background', [AuthController::class, 'updateCustomBg']);
    Route::delete('/profile/background', [AuthController::class, 'deleteCustomBg']);
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
    Route::get('/horarios/compartido/{userId}', [HorarioController::class, 'sharedSchedule']);
    Route::get('/horarios/buscar-usuario', [HorarioController::class, 'findUser']);

    Route::get('/pomodoro/config', [ConfigPomodoroController::class, 'show']);
    Route::put('/pomodoro/config', [ConfigPomodoroController::class, 'update']);
    Route::post('/pomodoro/sesiones', [SesionPomodoroController::class, 'store']);
    Route::get('/pomodoro/resumen', [SesionPomodoroController::class, 'resumenUsuario']);
    Route::get('/pomodoro/resumen-independiente', [SesionPomodoroController::class, 'resumenIndependiente']);
    Route::get('/pomodoro/productividad', [SesionPomodoroController::class, 'productividad']);
    Route::get('/materias/{materia}/pomodoro-resumen', [SesionPomodoroController::class, 'resumenMateria']);

    Route::get('/tareas/proximas', [TareaController::class, 'proximas']);
    Route::get('/tareas/pendientes-count', [TareaController::class, 'pendientesCount']);
    Route::get('/tareas', [TareaController::class, 'index']);
    Route::post('/tareas', [TareaController::class, 'store']);
    Route::put('/tareas/mover', [TareaController::class, 'mover']);
    Route::put('/tareas/{tarea}', [TareaController::class, 'update']);
    Route::delete('/tareas/{tarea}', [TareaController::class, 'destroy']);
    Route::post('/tareas/{tarea}/subtareas', [TareaController::class, 'storeSubtarea']);
    Route::put('/subtareas/{subtarea}', [TareaController::class, 'updateSubtarea']);
    Route::delete('/subtareas/{subtarea}', [TareaController::class, 'destroySubtarea']);

    Route::get('/marcadores', [MarcadorController::class, 'index']);
    Route::post('/marcadores', [MarcadorController::class, 'store']);
    Route::put('/marcadores/{marcador}', [MarcadorController::class, 'update']);
    Route::delete('/marcadores/{marcador}', [MarcadorController::class, 'destroy']);

    Route::get('/alertas', [AlertaController::class, 'index']);
    Route::post('/alertas', [AlertaController::class, 'store']);
    Route::put('/alertas/{alerta}', [AlertaController::class, 'update']);
    Route::delete('/alertas/{alerta}', [AlertaController::class, 'destroy']);

    Route::get('/pagos-cuota/estado', [PagoCuotaController::class, 'estado']);
    Route::post('/pagos-cuota', [PagoCuotaController::class, 'store']);

    // Rutas de Flashcards
    Route::get('/flashcards/decks', [FlashcardController::class, 'indexDecks']);
    Route::post('/flashcards/decks', [FlashcardController::class, 'storeDeck']);
    Route::post('/flashcards/decks/import', [FlashcardController::class, 'importDeck']);
    Route::post('/flashcards/decks/generate-ia', [FlashcardController::class, 'generateFromIA']);
    Route::put('/flashcards/decks/{deck}', [FlashcardController::class, 'updateDeck']);
    Route::delete('/flashcards/decks/{deck}', [FlashcardController::class, 'destroyDeck']);
    Route::get('/flashcards/decks/{deck}/cards', [FlashcardController::class, 'indexCards']);
    Route::post('/flashcards/decks/{deck}/cards', [FlashcardController::class, 'storeCard']);
    Route::put('/flashcards/cards/{card}', [FlashcardController::class, 'updateCard']);
    Route::delete('/flashcards/cards/{card}', [FlashcardController::class, 'destroyCard']);
    Route::post('/flashcards/cards/{card}/resultado', [FlashcardController::class, 'recordResult']);
    Route::post('/flashcards/cards/generate-distractors', [FlashcardController::class, 'generateDistractors']);
    
    // Rutas de administración
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/alumnos', [AdminController::class, 'listarAlumnos']);
        Route::get('/alumnos/buscar', [AdminController::class, 'buscarAlumno']);
        Route::delete('/alumnos/{id}', [AdminController::class, 'eliminarAlumno']);
        Route::get('/cuotas/estado', [AdminController::class, 'cuotasEstado']);
        Route::post('/cuotas', [AdminController::class, 'setCuota']);
        Route::get('/plan-estudios', [AdminController::class, 'getPlanEstudios']);
        Route::post('/plan-estudios', [AdminController::class, 'storeMateria']);
        Route::put('/plan-estudios/{id}', [AdminController::class, 'updateMateria']);
        Route::delete('/plan-estudios/{id}', [AdminController::class, 'destroyMateria']);
    });
    
});
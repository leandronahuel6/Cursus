<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MateriaController;
use App\Http\Controllers\NotaController;
use App\Http\Controllers\CuotaController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::get('/materias', [MateriaController::class, 'index']);
Route::get('/cuotas', [CuotaController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/notas', [NotaController::class, 'index']);
    Route::post('/notas', [NotaController::class, 'store']);
    Route::put('/notas/{nota}', [NotaController::class, 'update']);
    Route::delete('/notas/{nota}', [NotaController::class, 'destroy']);

    Route::post('/cuotas', [CuotaController::class, 'store']);
});
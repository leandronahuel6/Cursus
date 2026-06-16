<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->name('dashboard');

// Área de estudio (Pomodoro, Kanban, etc.)
Route::get('/area-estudio', function () {
    return view('area-estudio');
})->name('area-estudio');

// Rutas placeholders para las demás secciones
Route::get('/materias', function () {
    return view('materias');
})->name('materias');

Route::get('/plan-estudios', function () {
    return view('materias');
})->name('plan-estudios');

Route::get('/horarios', function () {
    return view('horarios');
})->name('horarios');

Route::get('/progreso', function () {
    return view('progreso');
})->name('progreso');

Route::get('/alertas', function () {
    return view('alertas');
})->name('alertas');

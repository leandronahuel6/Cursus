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
    return view('placeholder', ['title' => 'Mis Materias']);
})->name('materias');

Route::get('/plan-estudios', function () {
    return view('placeholder', ['title' => 'Plan de Estudios']);
})->name('plan-estudios');

Route::get('/horarios', function () {
    return view('placeholder', ['title' => 'Simulador de Horarios']);
})->name('horarios');

Route::get('/promedio', function () {
    return view('placeholder', ['title' => 'Calculadora de Promedio']);
})->name('promedio');

Route::get('/tramites', function () {
    return view('placeholder', ['title' => 'Trámites']);
})->name('tramites');

Route::get('/metricas', function () {
    return view('placeholder', ['title' => 'Métricas']);
})->name('metricas');

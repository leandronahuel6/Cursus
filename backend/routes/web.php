<?php

use Illuminate\Support\Facades\Route;


Route::get('/', function () {
    return view('welcome');
})->name('welcome');

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

Route::get('/beneficios', function () {
    return view('beneficios');
})->name('beneficios');

Route::get('/flashcards', function () {
    return view('flashcards');
})->name('flashcards');

Route::get('/progreso', function () {
    return view('progreso');
})->name('progreso');

Route::get('/alertas', function () {
    return view('alertas');
})->name('alertas');

Route::get('/contacto', function () {
    return view('contacto');
})->name('contacto');

// Admin
Route::get('/admin/alumnos', function () {
    return view('admin.alumnos');
})->name('admin.alumnos');

Route::get('/admin/cuotas', function () {
    return view('admin.cuotas');
})->name('admin.cuotas');

Route::get('/admin/plan-estudios', function () {
    return view('admin.plan-estudios');
})->name('admin.plan-estudios');

Route::view('/login', 'login')->name('login');
Route::view('/register', 'register')->name('register');

Route::view('/forgot-password', 'forgot-password')->name('password.request');
Route::get('/reset-password/{token}', function (string $token) {
    return view('reset-password', ['token' => $token]);
})->name('password.reset');


<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega el campo 'comision' a la tabla de horarios de usuarios.
     * Es nullable porque las actividades personales no tienen comisión asignada,
     * y los bloques de materias pueden no tener una comisión seleccionada.
     */
    public function up(): void
    {
        Schema::table('horarios_usuarios', function (Blueprint $table) {
            $table->string('comision', 20)->nullable()->after('version');
        });
    }

    /**
     * Revierte la migración eliminando la columna 'comision'.
     */
    public function down(): void
    {
        Schema::table('horarios_usuarios', function (Blueprint $table) {
            $table->dropColumn('comision');
        });
    }
};

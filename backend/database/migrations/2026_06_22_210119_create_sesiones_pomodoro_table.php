<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sesiones_pomodoro', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('materia_id')->nullable()->constrained('materias')->onDelete('set null');
            $table->integer('duracion_segundos');
            $table->timestamp('completada_en');
            $table->timestamps();

            $table->index(['usuario_id', 'completada_en']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sesiones_pomodoro');
    }
};

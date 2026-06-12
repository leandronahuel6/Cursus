<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void{
        Schema::create('horarios_usuarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('users')->onDelete('cascade');
            $table->enum('tipo', ['materia', 'actividad']);
            $table->foreignId('materia_id')->nullable()->constrained('materias')->onDelete('cascade');
            $table->string('titulo_actividad')->nullable();
            $table->integer('dia_semana');
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->timestamps();
        });
    }

    public function down(): void{
        Schema::dropIfExists('horarios_usuarios');
    }
};

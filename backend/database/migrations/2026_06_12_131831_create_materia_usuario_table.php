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
        Schema::create('materia_usuario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('materia_id')->constrained('materias')->onDelete('cascade');
            $table->enum('estado_historico', ['libre', 'regular', 'aprobada'])->default('libre');
            $table->boolean('cursando_actualmente')->default(false);
            $table->unique(['usuario_id', 'materia_id']);
            $table->timestamps();
        });
}

    public function down(): void{
        Schema::dropIfExists('materia_usuario');
    }
};

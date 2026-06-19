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
        Schema::create('notas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('materia_usuario_id')->constrained('materia_usuario')->onDelete('cascade');
            $table->enum('tipo', ['parcial', 'recuperatorio', 'tp', 'final']);
            $table->integer('numero');
            $table->decimal('valor', 4, 2);
            $table->date('fecha');
            $table->timestamps();
        });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notas');
    }
};

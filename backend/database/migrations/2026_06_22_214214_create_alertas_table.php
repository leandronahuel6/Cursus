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
        Schema::create('alertas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('users')->onDelete('cascade');
            $table->enum('categoria', ['academic', 'administrative', 'personal']);
            $table->string('titulo');
            $table->string('descripcion')->nullable();
            $table->date('fecha');
            $table->enum('prioridad', ['baja', 'media', 'alta'])->default('media');
            $table->boolean('completada')->default(false);
            $table->timestamps();

            $table->index(['usuario_id', 'fecha']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alertas');
    }
};

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
        Schema::create('flashcards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mazo_id')->constrained('flashcard_decks')->onDelete('cascade');
            $table->text('pregunta');
            $table->text('respuesta');
            $table->integer('correctas')->default(0);
            $table->integer('incorrectas')->default(0);
            $table->string('ultimo_resultado')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('flashcards');
    }
};

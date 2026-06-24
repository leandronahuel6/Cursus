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
        Schema::create('correlatividades', function (Blueprint $table) {
        $table->foreignId('materia_id')->constrained('materias')->onDelete('cascade');
        $table->foreignId('requisito_id')->constrained('materias')->onDelete('cascade');
        $table->enum('condicion_requerida', ['regular', 'aprobada']);
        $table->primary(['materia_id', 'requisito_id', 'condicion_requerida']);
        $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('correlatividades');
    }
};

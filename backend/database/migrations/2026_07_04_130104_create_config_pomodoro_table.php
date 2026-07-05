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
        Schema::create('config_pomodoro', function (Blueprint $table) {
            $table->foreignId('usuario_id')->primary()->constrained('users')->onDelete('cascade');
            $table->enum('preset_activo', ['classic', 'deep', 'short', 'custom'])->default('classic');
            $table->integer('tiempo_enfoque')->default(25);
            $table->integer('descanso_corto')->default(5);
            $table->integer('descanso_largo')->default(20);
            $table->integer('sesiones_por_ciclo')->default(4);
            $table->integer('ciclos_totales')->nullable()->default(null);
            $table->enum('sonido_alarma', ['chime', 'beep', 'zen'])->default('chime');
            $table->boolean('modo_estricto')->default(false);
            $table->boolean('reproducir_alarma')->default(true);
            $table->boolean('mostrar_widget')->default(true);
            $table->boolean('auto_reproduccion_fases')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('config_pomodoro');
    }
};

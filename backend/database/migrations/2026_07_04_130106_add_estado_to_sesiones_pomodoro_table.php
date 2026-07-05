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
        Schema::table('sesiones_pomodoro', function (Blueprint $table) {
            $table->enum('estado', ['completada', 'completada_parcial', 'abandonada'])->default('completada')->after('completada_en');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sesiones_pomodoro', function (Blueprint $table) {
            $table->dropColumn('estado');
        });
    }
};

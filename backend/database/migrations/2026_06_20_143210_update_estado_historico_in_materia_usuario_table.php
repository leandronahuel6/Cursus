<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE materia_usuario MODIFY estado_historico ENUM('libre', 'regular', 'aprobada', 'cursando') NOT NULL DEFAULT 'libre'");

        Schema::table('materia_usuario', function (Blueprint $table) {
            $table->dropColumn('cursando_actualmente');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('materia_usuario', function (Blueprint $table) {
            $table->boolean('cursando_actualmente')->default(false);
        });

        DB::statement("ALTER TABLE materia_usuario MODIFY estado_historico ENUM('libre', 'regular', 'aprobada') NOT NULL DEFAULT 'libre'");
    }
};

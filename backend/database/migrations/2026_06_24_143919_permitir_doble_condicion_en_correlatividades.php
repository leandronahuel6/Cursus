<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * El TFI exige cursadas (regular) ciertas materias para iniciarse y, además,
     * aprobadas para acreditarse. Eso implica que un mismo par (materia, requisito)
     * puede necesitar una fila 'regular' y otra 'aprobada' a la vez, algo que la PK
     * original (materia_id, requisito_id) no permitía.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE correlatividades DROP PRIMARY KEY, ADD PRIMARY KEY (materia_id, requisito_id, condicion_requerida)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE correlatividades DROP PRIMARY KEY, ADD PRIMARY KEY (materia_id, requisito_id)');
    }
};

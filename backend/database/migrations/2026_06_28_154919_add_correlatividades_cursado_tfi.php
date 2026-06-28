<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // Para CURSAR el TFI se requiere condición Regular o Aprobada en:
    // 8=Inglés I, 9=Programación III, 10=Base de Datos II,
    // 11=Metodología de Sistemas I, 12=Inglés II
    private array $requisitos = [8, 9, 10, 11, 12];

    public function up(): void
    {
        $ahora = now();
        foreach ($this->requisitos as $rid) {
            DB::table('correlatividades')->insertOrIgnore([
                'materia_id'          => 18,
                'requisito_id'        => $rid,
                'condicion_requerida' => 'regular',
                'created_at'          => $ahora,
                'updated_at'          => $ahora,
            ]);
        }
    }

    public function down(): void
    {
        DB::table('correlatividades')
            ->where('materia_id', 18)
            ->where('condicion_requerida', 'regular')
            ->whereIn('requisito_id', $this->requisitos)
            ->delete();
    }
};

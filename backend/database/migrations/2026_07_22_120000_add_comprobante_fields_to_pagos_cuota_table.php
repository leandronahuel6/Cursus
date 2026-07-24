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
        Schema::table('pagos_cuota', function (Blueprint $table) {
            $table->string('estado', 20)->default('pendiente')->after('periodo');
            $table->decimal('monto_base', 10, 2)->nullable()->after('estado');
            $table->decimal('monto_exigible', 10, 2)->nullable()->after('monto_base');
            $table->decimal('monto_declarado', 10, 2)->nullable()->after('monto_exigible');
            $table->string('comprobante_path')->nullable()->after('monto_declarado');
            $table->string('comprobante_mime')->nullable()->after('comprobante_path');
            $table->json('datos_extraidos_ia')->nullable()->after('comprobante_mime');
            $table->foreignId('eliminado_por')->nullable()->after('datos_extraidos_ia')->constrained('users')->nullOnDelete();
            $table->string('motivo_eliminacion')->nullable()->after('eliminado_por');
            $table->softDeletes();

            $table->date('fecha_pago')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pagos_cuota', function (Blueprint $table) {
            $table->dropConstrainedForeignId('eliminado_por');
            $table->dropColumn([
                'estado',
                'monto_base',
                'monto_exigible',
                'monto_declarado',
                'comprobante_path',
                'comprobante_mime',
                'datos_extraidos_ia',
                'motivo_eliminacion',
            ]);
            $table->dropSoftDeletes();

            $table->date('fecha_pago')->nullable(false)->change();
        });
    }
};

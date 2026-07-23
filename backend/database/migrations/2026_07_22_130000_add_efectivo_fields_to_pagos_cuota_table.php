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
            $table->string('medio_pago', 20)->nullable()->after('estado'); // 'transferencia' | 'efectivo'
            $table->foreignId('confirmado_por')->nullable()->after('motivo_eliminacion')->constrained('users')->nullOnDelete();
            $table->timestamp('confirmado_en')->nullable()->after('confirmado_por');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pagos_cuota', function (Blueprint $table) {
            $table->dropConstrainedForeignId('confirmado_por');
            $table->dropColumn(['medio_pago', 'confirmado_en']);
        });
    }
};

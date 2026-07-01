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
        Schema::table('horarios_usuarios', function (Blueprint $table) {
            $table->string('color')->nullable()->after('hora_fin');
            $table->string('version')->default('A')->after('color');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('horarios_usuarios', function (Blueprint $table) {
            $table->dropColumn(['color', 'version']);
        });
    }
};

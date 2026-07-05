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
        Schema::table('users', function (Blueprint $table) {
            $table->string('bg_preset')->nullable()->default('utn-haedo')->after('avatar');
            $table->integer('bg_opacity')->nullable()->default(10)->after('bg_preset');
            $table->double('bg_blur')->nullable()->default(1.8)->after('bg_opacity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['bg_preset', 'bg_opacity', 'bg_blur']);
        });
    }
};

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
        Schema::table('flashcards', function (Blueprint $table) {
            $table->string('distractor_1')->nullable()->after('respuesta');
            $table->string('distractor_2')->nullable()->after('distractor_1');
            $table->string('distractor_3')->nullable()->after('distractor_2');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('flashcards', function (Blueprint $table) {
            $table->dropColumn(['distractor_1', 'distractor_2', 'distractor_3']);
        });
    }
};

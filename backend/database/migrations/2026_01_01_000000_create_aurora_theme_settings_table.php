<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * Creates the dedicated Aurora theme settings table. A single JSON row
     * (key = "config") holds the whole theme configuration; the service
     * layer deep-merges it over built-in defaults so forward migrations
     * never break on missing keys.
     */
    public function up(): void
    {
        Schema::create('aurora_theme_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 191)->unique();
            $table->longText('value')->nullable();
            $table->timestamps();
        });

        try {
            $defaults = \Pterodactyl\Services\AuroraThemeService::defaults();

            DB::table('aurora_theme_settings')->updateOrInsert(
                ['key' => 'config'],
                [
                    'value' => json_encode($defaults, JSON_UNESCAPED_SLASHES),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        } catch (\Throwable $e) {
            // Never fail a panel migration run because of theme seeding —
            // the service lazily seeds defaults on first read instead.
            report($e);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('aurora_theme_settings');
    }
};

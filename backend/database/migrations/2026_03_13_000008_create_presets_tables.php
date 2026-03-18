<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('presets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('category', 50);
            $table->longText('prompt');
            $table->string('ratio', 20)->nullable();
            $table->integer('seed')->nullable();
            $table->string('type', 20)->default('image');
            $table->boolean('is_system')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('preset_preview_media', function (Blueprint $table) {
            $table->id();
            $table->uuid('preset_id');
            $table->uuid('media_item_id');
            $table->unsignedInteger('position')->default(1);
            $table->timestamps();

            $table->unique(['preset_id', 'media_item_id']);
            $table->foreign('preset_id')->references('id')->on('presets')->cascadeOnDelete();
            $table->foreign('media_item_id')->references('id')->on('media_items')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('preset_preview_media');
        Schema::dropIfExists('presets');
    }
};

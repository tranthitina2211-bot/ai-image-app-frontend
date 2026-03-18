<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('favorite_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('media_item_id');
            $table->timestamps();

            $table->unique(['user_id', 'media_item_id']);
            $table->foreign('media_item_id')->references('id')->on('media_items')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('favorite_media');
    }
};

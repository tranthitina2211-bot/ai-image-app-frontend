<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('collections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 120);
            $table->uuid('cover_media_item_id')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->foreign('cover_media_item_id')->references('id')->on('media_items')->nullOnDelete();
        });

        Schema::create('collection_items', function (Blueprint $table) {
            $table->id();
            $table->uuid('collection_id');
            $table->uuid('media_item_id');
            $table->unsignedInteger('position')->default(1);
            $table->timestamps();

            $table->unique(['collection_id', 'media_item_id']);
            $table->foreign('collection_id')->references('id')->on('collections')->cascadeOnDelete();
            $table->foreign('media_item_id')->references('id')->on('media_items')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collection_items');
        Schema::dropIfExists('collections');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('prompt_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('source', 20);
            $table->longText('prompt');
            $table->string('type', 20)->nullable();
            $table->string('ratio', 20)->nullable();
            $table->integer('seed')->nullable();
            $table->uuid('media_item_id')->nullable();
            $table->uuid('preset_id')->nullable();
            $table->string('preset_name')->nullable();
            $table->timestamps();

            $table->foreign('media_item_id')->references('id')->on('media_items')->nullOnDelete();
            $table->foreign('preset_id')->references('id')->on('presets')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prompt_histories');
    }
};

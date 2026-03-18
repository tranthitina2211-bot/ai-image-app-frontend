<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('display_name')->nullable();
            $table->string('gender', 30)->default('prefer_not_to_say');
            $table->unsignedSmallInteger('birth_year')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('avatar_url')->nullable();
            $table->string('theme', 20)->default('dark');
            $table->string('grid_size', 20)->default('medium');
            $table->boolean('autoplay_video_preview')->default(true);
            $table->boolean('confirm_before_delete')->default(true);
            $table->string('default_ratio', 20)->default('1:1');
            $table->boolean('auto_open_result')->default(true);
            $table->boolean('auto_save_prompt')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_settings');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('media_stacks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('root_media_item_id')->nullable();
            $table->uuid('cover_media_item_id')->nullable();
            $table->string('title')->nullable();
            $table->string('source_type', 50)->default('generate');
            $table->bigInteger('order_in_board')->default(0);
            $table->unsignedInteger('item_count')->default(0);
            $table->timestamp('last_generated_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'order_in_board']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_stacks');
    }
};

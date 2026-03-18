<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('media_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('media_stack_id')->nullable();
            $table->uuid('source_job_id')->nullable();
            $table->uuid('parent_media_item_id')->nullable();
            $table->uuid('ghost_of_media_item_id')->nullable();
            $table->string('kind', 20)->default('media');
            $table->string('type', 20);
            $table->string('url')->nullable();
            $table->string('storage_disk')->nullable();
            $table->string('storage_path')->nullable();
            $table->string('mime_type')->nullable();
            $table->longText('prompt')->nullable();
            $table->longText('negative_prompt')->nullable();
            $table->string('ratio', 20)->nullable();
            $table->string('resolution', 50)->nullable();
            $table->integer('seed')->nullable();
            $table->unsignedInteger('favorite_count')->default(0);
            $table->string('status', 30)->default('processing')->index();
            $table->unsignedTinyInteger('progress')->default(0);
            $table->unsignedInteger('order_in_stack')->default(1);
            $table->bigInteger('order_in_board')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['user_id', 'order_in_board']);
            $table->index(['media_stack_id', 'order_in_stack']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_items');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('generation_jobs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('media_stack_id')->nullable();
            $table->uuid('parent_media_item_id')->nullable();
            $table->string('action', 50);
            $table->string('mode', 20);
            $table->string('provider', 50)->default('comfyui');
            $table->string('provider_job_id')->nullable()->index();
            $table->string('status', 30)->default('queued')->index();
            $table->unsignedTinyInteger('progress')->default(0);
            $table->longText('prompt')->nullable();
            $table->longText('negative_prompt')->nullable();
            $table->string('ratio', 20)->nullable();
            $table->string('resolution', 50)->nullable();
            $table->integer('seed')->nullable();
            $table->string('input_file_path')->nullable();
            $table->text('error_message')->nullable();
            $table->json('payload')->nullable();
            $table->timestamp('queued_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('generation_jobs');
    }
};

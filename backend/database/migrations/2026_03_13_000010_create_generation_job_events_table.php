<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('generation_job_events', function (Blueprint $table) {
            $table->id();
            $table->uuid('generation_job_id');
            $table->string('event_type', 50);
            $table->string('message')->nullable();
            $table->json('payload')->nullable();
            $table->timestamp('occurred_at')->nullable();
            $table->timestamps();

            $table->foreign('generation_job_id')->references('id')->on('generation_jobs')->cascadeOnDelete();
            $table->index(['generation_job_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('generation_job_events');
    }
};

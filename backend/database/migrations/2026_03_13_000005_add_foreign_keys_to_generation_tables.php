<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('media_stacks', function (Blueprint $table) {
            $table->foreign('root_media_item_id')->references('id')->on('media_items')->nullOnDelete();
            $table->foreign('cover_media_item_id')->references('id')->on('media_items')->nullOnDelete();
        });

        Schema::table('generation_jobs', function (Blueprint $table) {
            $table->foreign('media_stack_id')->references('id')->on('media_stacks')->nullOnDelete();
            $table->foreign('parent_media_item_id')->references('id')->on('media_items')->nullOnDelete();
        });

        Schema::table('media_items', function (Blueprint $table) {
            $table->foreign('media_stack_id')->references('id')->on('media_stacks')->nullOnDelete();
            $table->foreign('source_job_id')->references('id')->on('generation_jobs')->nullOnDelete();
            $table->foreign('parent_media_item_id')->references('id')->on('media_items')->nullOnDelete();
            $table->foreign('ghost_of_media_item_id')->references('id')->on('media_items')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('media_items', function (Blueprint $table) {
            $table->dropForeign(['media_stack_id']);
            $table->dropForeign(['source_job_id']);
            $table->dropForeign(['parent_media_item_id']);
            $table->dropForeign(['ghost_of_media_item_id']);
        });

        Schema::table('generation_jobs', function (Blueprint $table) {
            $table->dropForeign(['media_stack_id']);
            $table->dropForeign(['parent_media_item_id']);
        });

        Schema::table('media_stacks', function (Blueprint $table) {
            $table->dropForeign(['root_media_item_id']);
            $table->dropForeign(['cover_media_item_id']);
        });
    }
};

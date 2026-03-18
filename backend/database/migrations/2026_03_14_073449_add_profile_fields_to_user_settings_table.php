<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('user_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('user_settings', 'gender')) {
                $table->string('gender', 32)->default('prefer_not_to_say')->after('display_name');
            }

            if (!Schema::hasColumn('user_settings', 'birth_year')) {
                $table->unsignedInteger('birth_year')->nullable()->after('gender');
            }

            if (!Schema::hasColumn('user_settings', 'phone')) {
                $table->string('phone', 30)->nullable()->after('birth_year');
            }
        });
    }

    public function down(): void
    {
        Schema::table('user_settings', function (Blueprint $table) {
            if (Schema::hasColumn('user_settings', 'phone')) {
                $table->dropColumn('phone');
            }

            if (Schema::hasColumn('user_settings', 'birth_year')) {
                $table->dropColumn('birth_year');
            }

            if (Schema::hasColumn('user_settings', 'gender')) {
                $table->dropColumn('gender');
            }
        });
    }
};
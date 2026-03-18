<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('plan_code', 50);
            $table->string('plan_name', 100);
            $table->string('status', 30)->default('active');
            $table->string('provider', 30)->default('stripe');
            $table->string('provider_subscription_id')->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamp('renews_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('plan_code', 50);
            $table->string('provider', 30)->default('stripe');
            $table->string('provider_session_id')->nullable()->unique();
            $table->string('provider_payment_intent_id')->nullable();
            $table->unsignedInteger('amount')->default(0);
            $table->string('currency', 10)->default('usd');
            $table->string('status', 30)->default('pending');
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('user_subscriptions');
    }
};

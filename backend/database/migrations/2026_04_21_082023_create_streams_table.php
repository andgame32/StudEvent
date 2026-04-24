<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('streams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('preview_path')->nullable();
            $table->dateTime('scheduled_at');
            $table->string('status')->default('scheduled');
            $table->longText('host_offer')->nullable();
            $table->longText('viewer_answer')->nullable();
            $table->json('host_ice_candidates')->nullable();
            $table->json('viewer_ice_candidates')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('streams');
    }
};

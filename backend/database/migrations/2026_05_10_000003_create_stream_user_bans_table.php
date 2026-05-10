<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('stream_user_bans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stream_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('moderator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('blocked_until')->nullable();
            $table->timestamps();
            $table->unique(['stream_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stream_user_bans');
    }
};

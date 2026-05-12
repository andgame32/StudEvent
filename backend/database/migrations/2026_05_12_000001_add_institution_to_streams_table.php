<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('streams', function (Blueprint $table) {
            $table->string('institution')->nullable()->after('user_id');
        });

        DB::table('streams')
            ->join('users', 'streams.user_id', '=', 'users.id')
            ->whereNull('streams.institution')
            ->update(['streams.institution' => DB::raw('users.institution')]);
    }

    public function down(): void
    {
        Schema::table('streams', function (Blueprint $table) {
            $table->dropColumn('institution');
        });
    }
};

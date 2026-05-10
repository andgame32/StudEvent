<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StreamUserBan extends Model
{
    protected $fillable = ['stream_id', 'user_id', 'moderator_id', 'blocked_until'];

    protected function casts(): array
    {
        return ['blocked_until' => 'datetime'];
    }
}

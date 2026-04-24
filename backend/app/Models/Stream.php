<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Stream extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'preview_path',
        'scheduled_at',
        'status',
        'host_offer',
        'viewer_answer',
        'host_ice_candidates',
        'viewer_ice_candidates',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'host_ice_candidates' => 'array',
        'viewer_ice_candidates' => 'array',
    ];

    protected $appends = ['preview_url'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function getPreviewUrlAttribute(): ?string
    {
        if (! $this->preview_path) {
            return null;
        }

        return Storage::url($this->preview_path);
    }
}

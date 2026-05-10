<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    public function show(string $folder, string $path)
    {
        if (!in_array($folder, ['avatars', 'previews'], true)) {
            abort(404);
        }

        $safePath = trim($path, '/');
        $fullPath = $folder.'/'.$safePath;

        if (!Storage::disk('public')->exists($fullPath)) {
            abort(404);
        }

        return Storage::disk('public')->response($fullPath);
    }
}

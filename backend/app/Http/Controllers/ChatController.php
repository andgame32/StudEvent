<?php

namespace App\Http\Controllers;

use App\Models\Stream;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function index(Request $request, Stream $stream)
    {
        $sinceId = (int) $request->query('since_id', 0);

        $messages = $stream->messages()
            ->with('user:id,name')
            ->where('id', '>', $sinceId)
            ->orderBy('id')
            ->get();

        return response()->json($messages);
    }

    public function store(Request $request, Stream $stream)
    {
        $data = $request->validate([
            'text' => 'required|string|max:1000',
        ]);

        $message = $stream->messages()->create([
            'user_id' => $request->user()->id,
            'text' => $data['text'],
        ]);

        return response()->json($message->load('user:id,name'), 201);
    }
}

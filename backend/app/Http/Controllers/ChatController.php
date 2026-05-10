<?php

namespace App\Http\Controllers;

use App\Models\Stream;
use App\Models\StreamUserBan;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function index(Request $request, Stream $stream)
    {
        $sinceId = (int) $request->query('since_id', 0);

        $messages = $stream->messages()
            ->with('user:id,name,avatar_path')
            ->where('id', '>', $sinceId)
            ->orderBy('id')
            ->get();

        return response()->json($messages);
    }

    public function store(Request $request, Stream $stream)
    {
        $user = $this->authUser($request);
        abort_if($user->is_blocked, 403, 'Пользователь заблокирован администратором.');
        $ban = StreamUserBan::where('stream_id', $stream->id)->where('user_id', $user->id)->first();
        abort_if($ban && (!$ban->blocked_until || $ban->blocked_until->isFuture()), 403, 'Вы временно заблокированы в этом чате.');
        $data = $request->validate(['text' => 'required|string|max:1000']);

        $message = $stream->messages()->create([
            'user_id' => $user->id,
            'text' => $data['text'],
        ]);

        return response()->json($message->load('user:id,name,avatar_path'), 201);
    }
}

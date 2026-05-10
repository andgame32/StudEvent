<?php

namespace App\Http\Controllers;

use App\Models\Stream;
use App\Models\StreamUserBan;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModerationController extends Controller
{
    public function blockUser(Request $request, Stream $stream): JsonResponse
    {
        $moderator = $this->authUser($request);
        abort_if(!in_array($moderator->role, ['moderator', 'admin']) && !$moderator->is_admin, 403, 'Нет прав модератора.');

        $data = $request->validate(['user_id' => 'required|exists:users,id', 'minutes' => 'required|integer|min:1|max:10080']);
        $target = User::findOrFail($data['user_id']);

        StreamUserBan::updateOrCreate(
            ['stream_id' => $stream->id, 'user_id' => $target->id],
            ['moderator_id' => $moderator->id, 'blocked_until' => now()->addMinutes($data['minutes'])]
        );

        return response()->json(['message' => 'Пользователь заблокирован на этом стриме']);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Stream;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    protected function ensureAdmin(Request $request): void
    {
        abort_unless($this->authUser($request)->is_admin, 403, 'Admin only');
    }

    public function users(Request $request)
    {
        $this->ensureAdmin($request);

        return User::orderByDesc('created_at')->get();
    }

    public function updateUser(Request $request, User $user): JsonResponse
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
            'is_admin' => 'sometimes|boolean',
        ]);

        $user->update($data);

        return response()->json($user->fresh());
    }

    public function block(Request $request, User $user): JsonResponse
    {
        $this->ensureAdmin($request);
        $user->update(['is_blocked' => true]);

        return response()->json(['message' => 'User blocked']);
    }

    public function unblock(Request $request, User $user): JsonResponse
    {
        $this->ensureAdmin($request);
        $user->update(['is_blocked' => false]);

        return response()->json(['message' => 'User unblocked']);
    }

    public function stopStream(Request $request, Stream $stream): JsonResponse
    {
        $this->ensureAdmin($request);
        $stream->update(['status' => 'ended']);

        return response()->json(['message' => 'Stream stopped']);
    }

    public function deleteMessage(Request $request, Message $message): JsonResponse
    {
        $this->ensureAdmin($request);
        $message->delete();

        return response()->json(['message' => 'Message deleted']);
    }

    public function metrics(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        $total_visits = Stream::count();
        $total_messages = Message::count();

        return response()->json([
            'total_visits' => $total_visits,
            'total_messages' => $total_messages,
        ]);
    }
}

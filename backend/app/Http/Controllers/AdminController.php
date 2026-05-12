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
            'is_blocked' => 'sometimes|boolean',
            'role' => 'sometimes|required|in:student,teacher,moderator,admin',
            'institution' => 'sometimes|nullable|in:ИАТ,ИРГУПС,ПОЛИТЕХ',
        ]);

        if (isset($data['role'])) {
            $data['is_admin'] = $data['role'] === 'admin';
        }

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

    public function streams(Request $request)
    {
        $this->ensureAdmin($request);

        return Stream::with('user:id,name,email,institution')
            ->orderByDesc('created_at')
            ->get();
    }

    public function stopStream(Request $request, Stream $stream): JsonResponse
    {
        $this->ensureAdmin($request);
        $stream->update([
            'status' => 'ended',
            'host_offer' => null,
            'viewer_answer' => null,
            'host_ice_candidates' => null,
            'viewer_ice_candidates' => null,
        ]);

        return response()->json($stream->fresh()->load('user:id,name,email,institution'));
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

        $streamsByStatus = Stream::selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');
        $usersByRole = User::selectRaw('role, COUNT(*) as total')
            ->groupBy('role')
            ->pluck('total', 'role');
        $messagesByDay = Message::selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        return response()->json([
            'totals' => [
                'streams' => Stream::count(),
                'live_streams' => Stream::where('status', 'live')->count(),
                'messages' => Message::count(),
                'users' => User::count(),
            ],
            'streams_by_status' => $streamsByStatus,
            'users_by_role' => $usersByRole,
            'messages_by_day' => $messagesByDay,
        ]);
    }
}
